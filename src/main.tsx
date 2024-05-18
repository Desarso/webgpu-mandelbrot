import { createSignal, onMount, type Component } from "solid-js";
import { App } from "./control/app";

const [app, setApp] = createSignal<App>();

async function main() {
  const canvas = document.getElementById("gfx-main") as HTMLCanvasElement;
  setApp(new App(canvas));
  await app()?.initialize();
  app()?.run();
}

const Main: Component = () => {
  onMount(() => {
    main();

    let canvas = document.getElementById("gfx-main") as HTMLCanvasElement;
    let input = document.querySelector("#go-to input") as HTMLInputElement;
    input.value = ("-0.8348685503005981, 0.19162757694721222, 6.924854574208439e-7, 216");
    let submit = document.querySelector("#go-to button") as HTMLButtonElement;
    submit.click();
  

    //listen for keys
  });

  return (
    <div>
      <div class="controls">
        <h1 id="compatability-check"></h1>
        <div class="container">
          <input type="range" id="iterations" min="1" max="2000" value={100} />
          <label for="iterations">Iterations</label>
        </div>
        <div class="container">
          <div class="zoomLevel">Zoom level: 1.0</div>
        </div>
        <div class="container">
          <div class="origin">
            Origin: (0.0, 0.0i)
           
          </div>
          <div class="copyCoords">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                fill="white"
                width="16"
                height="16"
              >
                <path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z" />
              </svg>
            </div>
        </div>
        <div class="container">
          <form id="go-to">
            <input type="text" id="formula" placeholder="input data" />
            <button type="submit" >Go To</button>  
          </form>
        </div>
      </div>
      <canvas id="gfx-main"></canvas>
    </div>
  );
};

export default Main;
