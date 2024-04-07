import { Renderer } from "../view/renderer";
import { Scene } from "../model/scene";
import { vec2 } from "gl-matrix";
import { s } from "vite/dist/node/types.d-aGj9QkWt";

export class App {
  canvas: HTMLCanvasElement;
  renderer: Renderer;

  keyLabel: HTMLElement;
  mouseXLabel: HTMLElement;
  mouseYLabel: HTMLElement;
  iterations: Int32Array = new Int32Array([100]);
  iterLabel: string = "100";

  viewPortOrigin: vec2 = vec2.create();
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
    canvas.height = rec?.height;2
    this.renderer = new Renderer(canvas);

    this.viewPortOrigin = vec2.fromValues(0, 0);

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

        this.viewPortOrigin[0] -= diff[0];
        this.viewPortOrigin[1] -= diff[1];
        this.mousestart = mouseend;

        //get relative position within canvas
        let originTag = document.querySelector(".origin");
        originTag.innerText = `Origin: (${this.viewPortOrigin[0]}, ${this.viewPortOrigin[1]}i)`;
        
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
        if(this.viewPortScale[0] > 5) this.viewPortScale[0] = 5;
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
      navigator.clipboard.writeText(`(${this.viewPortOrigin[0]}, ${this.viewPortOrigin[1]}i)`);
      //let the user know it was copied with some brief text
      let originTag = document.querySelector(".origin");
      originTag.innerText = `Origin: Copied!`;
    });

    //listen for window size change
    window.addEventListener("resize", (event) => {
      let root = document.getElementById("root");
      let rec = root?.getBoundingClientRect();
      this.canvas.width = rec?.width;
      this.canvas.height = rec?.height;
      this.renderer.device.queue.writeBuffer(
        this.renderer.viewportScaleBuffer,
        0,
        this.viewPortScale
      );
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
      this.renderer.viewportOriginBuffer,
      0,
      new Float32Array(this.viewPortOrigin)
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
        this.viewPortOrigin[1] += moveamount * (this.viewPortScale[0]);
        break;
      case "s":
        this.viewPortOrigin[1] -= moveamount * this.viewPortScale[0];
        break;
      case "a":
        this.viewPortOrigin[0] -= moveamount * this.viewPortScale[0];
        break;
      case "d":
        this.viewPortOrigin[0] += moveamount * this.viewPortScale[0];
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
