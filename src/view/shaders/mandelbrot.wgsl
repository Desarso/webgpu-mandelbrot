@binding(0) @group(0) var<uniform> viewportSize : vec2 < f32>;
@binding(1) @group(0) var<uniform> viewportOrigin : vec2 < f32>;
@binding(2) @group(0) var<uniform> viewScale : f32;
@binding(3) @group(0) var<uniform> maxIteration : i32;

@vertex
fn vs_main(@location(0) inPos : vec2 < f32>) -> @builtin(position) vec4 < f32> {
    return vec4 < f32 > (inPos, 0.0, 1.0);
}



@fragment
fn main(@builtin(position) FragCoord : vec4 < f32>) -> @location(0) vec4 < f32> {
    let aspectRatio : f32 = viewportSize.x / viewportSize.y;
    //Define the area of the complex plane to visualize
    var minReal : f32 = -2.5;
    var maxReal : f32 = 2.5;
    var minImaginary : f32 = -2.5;
    var maxImaginary : f32 = 2.5;

    if(aspectRatio > 1.0)
    {
        let range : f32 = (maxReal - minReal) * aspectRatio;
        minReal = - range / 2.0;
        maxReal = range / 2.0;
    } else
    {
        let range : f32 = (maxImaginary - minImaginary) / aspectRatio;
        minImaginary = - range / 2.0;
        maxImaginary = range / 2.0;
  }







    let actualminReal : f32 = (minReal * viewScale) + viewportOrigin.x;
    let actualmaxReal : f32 = (maxReal * viewScale) + viewportOrigin.x;
    let actualminImaginary : f32 = (minImaginary * viewScale) + viewportOrigin.y;
    let actualmaxImaginary : f32 = (maxImaginary * viewScale) + viewportOrigin.y;

    //Get the current pixel's coordinates in the complex plane
    let scale : vec2 < f32> = vec2 < f32 > (actualmaxReal - actualminReal, actualmaxImaginary - actualminImaginary) / viewportSize;
    let c : vec2 < f32> = vec2 < f32 > (actualminReal, actualminImaginary) + vec2 < f32 > (FragCoord.x, viewportSize.y - FragCoord.y) * scale;

    //Initialize the iteration variables
    var z : vec2 < f32> = c;
    var iteration : i32 = 0;
    let bailout : f32 = 4.0;
    var lastZ : vec2 < f32> = z;
    //var expiter: f32 = 0.0;

    //Perform the Mandelbrot iteration
    while (iteration < maxIteration && dot(z, z) < bailout)
    {
        lastZ = z;
        z = vec2 < f32 > (
        z.x * z.x - z.y * z.y + c.x,
        (z.x + z.x) * z.y + c.y
        );
        //expiter = expiter + exp(-length(z) - 0.5 / length(z - lastZ));
        iteration = iteration + 1;
    }
    //let normalizedIter : f32 = expiter / f32(maxIteration);
    //let color : vec3<f32> = vec3<f32>(normalizedIter, 1.0 - normalizedIter, 0.5 + 0.5 * normalizedIter);

    //Output the color with full opacity
    //return vec4<f32>(color, 1.0);
    //do two more iterations to get a smoother color

    let dotprod = dot(z, z);
    let modulus = sqrt(dotprod);
    let precal = -0.52139022765;
    let inverserlog2 = 3.32192809489;
    let p = log(dotprod) / log(dot(lastZ, lastZ));
    var mu : f32;
    if(modulus > 1 && iteration < i32(maxIteration))
    {
        let inverserlog2 = 3.32192809489;
        mu = (f32(iteration)) - (log(0.5 * dotprod) - precal) / p;
        //mu = f32(iteration) - (log(log(modulus))) * inverserlog2;
    }else{
        mu = f32(maxIteration);
    }

    if(mu == f32(maxIteration))
    {
        return vec4 < f32 > (0.0, 0.0, 0.0, 1.0);
    }
    //shift mue to make the colors more interesting


    let hue : f32 = mix(0.0, 1.0, mu / f32(maxIteration));
    //shift the hue to make the colors more interesting
    let saturation : f32 = 1.0;
    let lightness : f32 = 0.5;
    let color : vec3 < f32> = hslToRgb(hue, saturation, lightness);
    //Determine the color based on the number of iterations


    //Output the color with full opacity
    return vec4 < f32 > (color, 1.0);
}


fn hue2rgb(p : f32, q : f32, t : f32) -> f32 {
    var t_mod = t;
    if (t_mod < 0.0)
    {
        t_mod = t_mod + 1.0;
    }
    if (t_mod > 1.0)
    {
        t_mod = t_mod - 1.0;
    }
    if (t_mod < 1.0 / 6.0)
    {
        return p + (q - p) * 6.0 * t_mod;
    }
    if (t_mod < 0.5)
    {
        return q;
    }
    if (t_mod < 2.0 / 3.0)
    {
        return p + (q - p) * (2.0 / 3.0 - t_mod) * 6.0;
    }
    return p;
}

fn hslToRgb(h : f32, s : f32, l : f32) -> vec3 < f32> {
    var r : f32;
    var g : f32;
    var b : f32;

    if (s == 0.0)
    {
        r = l;
        g = l;
        b = l;
    } else {
        let q = select(l + s - l * s, l * (1.0 + s), l < 0.5);
        let p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);
    }

    return vec3 < f32 > (r, g, b);
}




//The viewport size should be passed in as a uniform
