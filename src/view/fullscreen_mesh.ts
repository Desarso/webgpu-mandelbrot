export class FullscreenQuadMesh {
    buffer: GPUBuffer;
    bufferLayout: GPUVertexBufferLayout;
  
    constructor(device: GPUDevice) {
      // Define vertices for a fullscreen quad
      // x, y, z, u, v
      const vertices: Float32Array = new Float32Array([
        // First triangle (bottom-left to top-right)
        -1.0, -1.0, 0.0, 0.0, 0.0, // Bottom-left
        -1.0,  1.0, 0.0, 0.0, 1.0, // Top-left
         1.0, -1.0, 0.0, 1.0, 0.0, // Bottom-right
        
        // Second triangle (top-right to bottom-left)
        -1.0,  1.0, 0.0, 0.0, 1.0, // Top-left
         1.0, -1.0, 0.0, 1.0, 0.0, // Bottom-right
         1.0,  1.0, 0.0, 1.0, 1.0, // Top-right
      ]);
  
      const usage: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
      const descriptor: GPUBufferDescriptor = {
        size: vertices.byteLength,
        usage: usage,
        mappedAtCreation: true,
      };
  
      this.buffer = device.createBuffer(descriptor);
  
      // Load the vertices into the buffer
      new Float32Array(this.buffer.getMappedRange()).set(vertices);
      this.buffer.unmap();
  
      // Define the buffer layout
      this.bufferLayout = {
        arrayStride: 5 * 4, // 5 components per vertex (x, y, z, u, v), each of 4 bytes (float)
        attributes: [
          {
            // Position (x, y, z)
            shaderLocation: 0,
            format: "float32x3",
            offset: 0,
          },
          {
            // Texture coordinates (u, v)
            shaderLocation: 1,
            format: "float32x2",
            offset: 12, // Offset is 3 components * 4 bytes/component = 12 bytes
          },
        ],
      };
    }
  }