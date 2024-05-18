import { Renderer } from "../view/renderer";
import { Scene } from "../model/scene";
import { vec2 } from "gl-matrix";
import { createSignal } from "solid-js";
import { Setter, Accessor } from "solid-js";
import { Complex } from "../classes/Complex";
import Decimal from "decimal.js";

export class App {
  canvas: HTMLCanvasElement;
  renderer: Renderer;

  keyLabel: HTMLElement;
  mouseXLabel: HTMLElement;
  mouseYLabel: HTMLElement;
  iterations: Int32Array = new Int32Array([1000]);
  iterLabel: string = "100";

  //view port origin is now top-left corner
  viewPortOrigin: Accessor<vec2>;
  setViewPortOrigin: Setter<vec2>;
  reference_orbit: Complex = new Complex(new Decimal(0), new Decimal(0));
  viewPortScale: Float32Array = new Float32Array([1.0]);

  forwards_amount: number = 0;
  right_amount: number = 0;

  mousestart: vec2 = vec2.create();
  mousedown: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    //set width and height of canvas
    let root = document.getElementById("root");
    let rec = root?.getBoundingClientRect();
    canvas.width = rec?.width;
    canvas.height = rec?.height;
    this.renderer = new Renderer(canvas);
    const [viewPortOrigin, setViewPortOrigin] = createSignal<vec2>(
      vec2.fromValues(0.2, 0.0)
    );

    this.viewPortOrigin = viewPortOrigin;
    this.setViewPortOrigin = setViewPortOrigin;

    document.addEventListener("keydown", (event) => {
      this.handle_keypress(event);
    });

    document.addEventListener("keyup", (event) => {
      this.handle_keyrelease(event);
    });

    canvas.addEventListener("mousedown", (event) => {
      this.mousedown = true;
      //get relative position within canvas
      let x = event.clientX;
      let y = event.clientY;
      let rect = this.canvas.getBoundingClientRect();
      let xrel = x - rect.left;
      let yrel = y - rect.top;

      //normalize to -1 to 1 and multiply by 5
      let xnorm = (xrel / this.canvas.width) * 2 - 1;
      let ynorm = 1 - (yrel / this.canvas.height) * 2;
      this.mousestart = vec2.fromValues(xnorm, ynorm);
      vec2.scale(this.mousestart, this.mousestart, 2.5 * this.viewPortScale[0]);
      console.log(this.mousestart);
    });

    canvas.addEventListener("mousemove", (event) => {
      if (this.mousedown) {
        let x = event.clientX;
        let y = event.clientY;
        let rect = this.canvas.getBoundingClientRect();
        let xrel = x - rect.left;
        let yrel = y - rect.top;
        let xnorm = (xrel / this.canvas.width) * 2 - 1;
        let ynorm = 1 - (yrel / this.canvas.height) * 2;
        let mouseend = vec2.fromValues(xnorm, ynorm);
        vec2.scale(mouseend, mouseend, 2.5 * this.viewPortScale[0]);
        //calculate difference between start and end
        let diff = vec2.create();
        vec2.sub(diff, mouseend, this.mousestart);

        this.viewPortOrigin()[0] -= diff[0];
        this.viewPortOrigin()[1] -= diff[1];
        this.mousestart = mouseend;

        //get relative position within canvas
        let originTag = document.querySelector(".origin");
        originTag.innerText = `Origin: (${this.viewPortOrigin()[0]}, ${
          this.viewPortOrigin()[1]
        }i)`;
      }
    });

    canvas.addEventListener("mouseup", (event) => {
      this.mousedown = false;
    });

    //detect if mouse leaves the canvas
    this.canvas.addEventListener("mouseleave", (event) => {
      this.mousedown = false;
    });

    //scroll to zoom
    this.canvas.addEventListener("wheel", (event) => {
      let delta = event.deltaY;
      const zoomSpeed = 0.1;
      let zoomtag = document.querySelector(".zoomLevel");

      if (delta > 0) {
        this.viewPortScale[0] *= 1 + zoomSpeed;
        if (this.viewPortScale[0] > 5) this.viewPortScale[0] = 5;
        let orders = Math.floor(Math.log10(this.viewPortScale[0]));
        orders = Math.abs(orders);

        zoomtag.innerText = `Zoom level: 1e-${orders}`;
      } else {
        this.viewPortScale[0] *= 1 - zoomSpeed;
        let orders = Math.floor(Math.log10(this.viewPortScale[0]));
        orders = Math.abs(orders);

        zoomtag.innerText = `Zoom level: 1e-${orders}`;
      }
    });

    //list for iterations change
    let iterations = document.getElementById("iterations");
    iterations?.addEventListener("input", (event) => {
      this.iterations[0] = parseInt((event.target as HTMLInputElement).value);
      let label = document.querySelector("label[for='iterations']");
      label.innerText = `Iterations: ${this.iterations[0]}`;
    });

    //listen for copy coords click
    let copyCoords = document.querySelector(".copyCoords");
    copyCoords?.addEventListener("click", (event) => {
      navigator.clipboard.writeText(
        `${this.viewPortOrigin()[0]}, ${this.viewPortOrigin()[1]}, ${
          this.viewPortScale[0]
        }, ${this.iterations[0]}`
      );
      //let the user know it was copied with some brief text
      let originTag = document.querySelector(".origin");
      originTag.innerText = `Origin: Copied!`;
    });

    //listen for window size change
    // window.addEventListener("resize", (event) => {
    //   let root = document.getElementById("root");
    //   let rec = root?.getBoundingClientRect();
    //   this.canvas.width = rec?.width;
    //   this.canvas.height = rec?.height;
    //   this.renderer.device.queue.writeBuffer(
    //     this.renderer.viewportScaleBuffer,
    //     0,
    //     this.viewPortScale
    //   );
    // });

    let submitbutton = document.querySelector("button[type='submit']");
    submitbutton?.addEventListener("click", (event) => {
      event.preventDefault();
      let form = document.getElementById("go-to") as HTMLFormElement;
      let input = form.querySelector("input") as HTMLInputElement;
      let data = input.value.split(",");
      if (data.length != 4) {
        alert("Input data must be 4 comma separated values");
        return;
      }
      let values = data.map((x) => parseFloat(x));
      if (values.some((x) => isNaN(x))) {
        alert("All values must be numbers");
        return;
      }
      this.viewPortOrigin()[0] = values[0];
      this.viewPortOrigin()[1] = values[1];
      this.viewPortScale[0] = values[2];
      this.iterations[0] = values[3];
      let iterations = document.getElementById(
        "iterations "
      ) as HTMLInputElement;
      iterations.value = this.iterations[0].toString();
    });
  }

  async initialize() {
    await this.renderer.Initialize();
  }

  run() {
    let running: boolean = true;

    // this.scene.update();
    // this.scene.move_player(this.forwards_amount, this.right_amount);
    this.renderer.device.queue.writeBuffer(
      this.renderer.viewPortOriginBuffer,
      0,
      new Float32Array(this.viewPortOrigin())
    );
    this.renderer.device.queue.writeBuffer(
      this.renderer.viewportScaleBuffer,
      0,
      this.viewPortScale
    );

    this.renderer.device.queue.writeBuffer(
      this.renderer.iterationsBuffer,
      0,
      this.iterations
    );


    let viewportSize = {
      x: this.canvas.width,
      y: this.canvas.height,
    };


    let aspectRatio = viewportSize.x / viewportSize.y;
    //Define the area of the complex plane to visualize
    var startx = -2.5;
    var endx = 2.5;
    var starty  = -2.5;
    var endy = 2.5;

     ///aspect ration stuff
    if(aspectRatio > 1.0)
    {
        let range = (endx - startx) * aspectRatio;
        startx = - range / 2.0;
        endx = range / 2.0;
    } else
    {
        let range = (endy - starty) / aspectRatio;
        starty = - range / 2.0;
        endy = range / 2.0;
    }



    startx = (startx * this.viewPortScale[0]) + this.viewPortOrigin()[0];
    endx = (endx * this.viewPortScale[0]) + this.viewPortOrigin()[0];
    starty = (starty * this.viewPortScale[0]) + this.viewPortOrigin()[1];
    endy = (endy * this.viewPortScale[0]) + this.viewPortOrigin()[1];

    this.reference_orbit = new Complex(new Decimal(startx), new Decimal(starty));

    let series = this.reference_orbit.high_precision_series(1000);


    //console.log(series.length);

    //turn reference orbit into pixel space
    let ratio_pixels = this.canvas.width / (endx - startx);
    let refernce_point = vec2.fromValues(
      this.reference_orbit.real.toNumber(),
      this.reference_orbit.imag.toNumber()
    );

    //translate to origin
    vec2.add(
      refernce_point,
      refernce_point,
      vec2.fromValues(this.canvas.width / 2, this.canvas.height / 2)
    );
    vec2.scale(refernce_point, refernce_point, ratio_pixels);

    let x_n = Complex.series_to_vec2(series);

    let data = new Float32Array(100 * 4);
    for (let i = 0; i < 100; i++) {
      data[i * 4] = x_n[i][0];
      data[i * 4 + 1] = x_n[i][1];
      data[i * 4 + 2] = 0; // Padding.x
      data[i * 4 + 3] = 0; // Padding.y
    }

    //get canvas size


    //Define the area of the complex plane to visualize

    let unit_delta = (endx - startx) / viewportSize.x;

    let delta_vec = vec2.fromValues(unit_delta, unit_delta);

    this.renderer.device.queue.writeBuffer(
      this.renderer.unit_delta_buffer,
      0,
      new Float32Array(delta_vec)
    );

    this.renderer.device.queue.writeBuffer(
      this.renderer.x_series_buffer,
      0,
      data
    );

    this.renderer.device.queue.writeBuffer(
      this.renderer.reference_orbit_buffer,
      0,
      new Float32Array([refernce_point[0], refernce_point[1]])
    );

    this.renderer.render();

    if (running) {
      requestAnimationFrame(this.run.bind(this));
    }
  }

  handle_keypress(event: KeyboardEvent) {
    (document.getElementById("key-label") ?? { innerText: "" }).innerText =
      event.key;
    const moveamount = 0.1;
    switch (event.key) {
      case "w":
        this.viewPortOrigin()[1] += moveamount * this.viewPortScale[0];
        break;
      case "s":
        this.viewPortOrigin()[1] -= moveamount * this.viewPortScale[0];
        break;
      case "a":
        this.viewPortOrigin()[0] -= moveamount * this.viewPortScale[0];
        break;
      case "d":
        this.viewPortOrigin()[0] += moveamount * this.viewPortScale[0];
        break;
    }
  }

  handle_keyrelease(event: KeyboardEvent) {
    (document.getElementById("key-label") ?? { innerText: "" }).innerText = "";

    switch (event.key) {
      case "w":
      case "s":
        this.forwards_amount = 0;
        break;
      case "a":
      case "d":
        this.right_amount = 0;
        break;
    }
  }

  handle_mouse_move(event: MouseEvent) {
    (document.getElementById("mouse-x-label") ?? { innerText: "" }).innerText =
      event.clientX.toString();
    (document.getElementById("mouse-y-label") ?? { innerText: "" }).innerText =
      event.clientY.toString();

    //check if mouse is locked to the canvas
  }
}
