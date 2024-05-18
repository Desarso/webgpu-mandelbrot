import shader from "./shaders/mandelbrot.wgsl?raw";
import { TriangleMesh } from "./triangle_mesh";
import { mat4 } from "gl-matrix";
import { Material } from "./material";
import { Camera } from "../model/camera";
import { Triangle } from "../model/triangle";
import { FullscreenQuadMesh } from "./fullscreen_mesh";

export class Renderer {
  canvas: HTMLCanvasElement;
  canvasWidth: number;
  canvasHeight: number;

  // Device/Context objects
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;

  // Pipeline objects
  viewportSizeBuffer: GPUBuffer;
  viewPortOriginBuffer: GPUBuffer;
  viewportScaleBuffer: GPUBuffer;
  iterationsBuffer: GPUBuffer;
  x_series_buffer: GPUBuffer;
  unit_delta_buffer: GPUBuffer;
  reference_orbit_buffer: GPUBuffer;


  bindGroup: GPUBindGroup;
  pipeline: GPURenderPipeline;

  // Assets
  fullscreenQuad: FullscreenQuadMesh;
  material: Material;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
  }

  async Initialize() {
    await this.setupDevice();

    await this.createAssets();

    await this.makePipeline();
  }

  async setupDevice() {
    //adapter: wrapper around (physical) GPU.
    //Describes features and limits
    this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
    //device: wrapper around GPU functionality
    //Function calls are made through the device
    this.device = <GPUDevice>await this.adapter?.requestDevice();

    console.log(this.device.limits.maxBufferSize);
    //context: similar to vulkan instance (or OpenGL context)
    this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
    this.format = "bgra8unorm";
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
    });
  }

  async makePipeline() {
    this.viewportSizeBuffer = this.device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.viewPortOriginBuffer = this.device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    this.viewportScaleBuffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.iterationsBuffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.unit_delta_buffer = this.device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    this.x_series_buffer = this.device.createBuffer({
      size: 16 * 100,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.reference_orbit_buffer = this.device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    

 



    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0, // matches @binding(0) in the shader
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, // used in both vertex and fragment shaders
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 1, // matches @binding(1) in the shader
          visibility: GPUShaderStage.FRAGMENT, // used in the fragment shader
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 2, // matches @binding(2) in the shader
          visibility: GPUShaderStage.FRAGMENT, // used in the fragment shader
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 3, // matches @binding(3) in the shader
          visibility: GPUShaderStage.FRAGMENT, // used in the fragment shader
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 4, // matches @binding(4) in the shader
          visibility: GPUShaderStage.FRAGMENT, // used in the fragment shader
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 5, // matches @binding(5) in the shader
          visibility: GPUShaderStage.FRAGMENT, // used in the fragment shader
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 6, // matches @binding(6) in the shader
          visibility: GPUShaderStage.FRAGMENT, // used in the fragment shader
          buffer: {
            type: "uniform",
          },
        }
      ],
    });

    // Create the bind group using the uniform buffer
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0, // binding number in the bind group layout
          resource: {
            buffer: this.viewportSizeBuffer,
          },
        },
        {
          binding: 1, // binding number in the bind group layout
          resource: {
            buffer: this.viewPortOriginBuffer,
          },
        },
        {
          binding: 2, // binding number in the bind group layout
          resource: {
            buffer: this.viewportScaleBuffer,
          },
        },
        {
          binding: 3, // binding number in the bind group layout
          resource: {
            buffer: this.iterationsBuffer,
          },
        }, 
        {
          binding: 4, // binding number in the bind group layout
          resource: {
            buffer: this.unit_delta_buffer,
          },
        },
        {
          binding: 5, // binding number in the bind group layout
          resource: {
            buffer: this.x_series_buffer,
          },
        },
        {
          binding: 6, // binding number in the bind group layout
          resource: {
            buffer: this.reference_orbit_buffer,
          },
        }
      ],
    });

    // Then, create the pipeline layout using the bind group layout
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({
          code: shader.toString(), // Your vertex shader code as a string
        }),
        entryPoint: "vs_main", // Entry point for the vertex shader
        buffers: [this.fullscreenQuad.bufferLayout],
      },

      fragment: {
        module: this.device.createShaderModule({
          code: shader.toString(), // Your Mandelbrot fragment shader code as a string
        }),
        entryPoint: "main", // Entry point for the Mandelbrot fragment shader
        targets: [
          {
            format: this.format, // The swap chain format
          },
        ],
      },

      primitive: {
        topology: "triangle-list", // We're still using a triangle list for the full-screen quad
      },

      layout: pipelineLayout,
    });
  }

  async createAssets() {
    this.fullscreenQuad = new FullscreenQuadMesh(this.device);
  }

  async render() {
    const commandEncoder = this.device.createCommandEncoder();

    // Texture view: image view to the color buffer in this case
    const textureView = this.context.getCurrentTexture().createView();

    // Render pass: holds draw commands, allocated from command encoder
    const renderpass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.5, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    // Set the pipeline and bind group for rendering
    renderpass.setPipeline(this.pipeline);
    renderpass.setBindGroup(0, this.bindGroup);




    this.device.queue.writeBuffer(
      this.viewportSizeBuffer,
      0,
      new Float32Array([this.canvasWidth, this.canvasHeight])
    );

    // Set the vertex buffer for the fullscreen quad
    renderpass.setVertexBuffer(0, this.fullscreenQuad.buffer);

    // Draw the fullscreen quad (2 triangles, 6 vertices)
    renderpass.draw(6, 1, 0, 0);

    // End the render pass
    renderpass.end();

    // Submit the commands recorded by the command encoder
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
