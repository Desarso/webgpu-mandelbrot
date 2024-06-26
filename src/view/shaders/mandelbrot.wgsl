@binding(0) @group(0) var<uniform> viewportSize : vec2 < f32>;
@binding(1) @group(0) var<uniform> viewportOrigin : vec2 < f32>;
@binding(2) @group(0) var<uniform> viewScale : f32;
@binding(3) @group(0) var<uniform> maxIteration : i32;
@binding(4) @group(0) var<uniform> unit_delta : vec2< f32>;
struct PaddedVec2 {
    value : vec2 < f32>,
    _padding : vec2 < f32>,
};



@binding(5) @group(0) var<uniform> x_n : array<PaddedVec2, 100>;
@binding(6) @group(0) var<uniform> reference_orbit : vec2 < f32>;


@vertex
fn vs_main(@location(0) inPos : vec2 < f32>) -> @builtin(position) vec4 < f32> {
    return vec4 < f32 > (inPos, 0.0, 1.0);
}



@fragment
fn main(@builtin(position) FragCoord : vec4 < f32>) -> @location(0) vec4 < f32> {
    let aspectRatio : f32 = viewportSize.x / viewportSize.y;
    //Define the area of the complex plane to visualize
    var startx : f32 = -2.5;
    var endx : f32 = 2.5;
    var starty : f32 = -2.5;
    var endy : f32 = 2.5;

     ///aspect ration stuff
    if(aspectRatio > 1.0)
    {
        let range : f32 = (endx - startx) * aspectRatio;
        startx = - range / 2.0;
        endx = range / 2.0;
    } else
    {
        let range : f32 = (endy - starty) / aspectRatio;
        starty = - range / 2.0;
        endy = range / 2.0;
    }



    startx = (startx * viewScale) + viewportOrigin.x;
    endx = (endx * viewScale) + viewportOrigin.x;
    starty = (starty * viewScale) + viewportOrigin.y;
    endy = (endy * viewScale) + viewportOrigin.y;

    //Get the current pixel's coordinates in the complex plane
    let scale : vec2 < f32> = vec2 < f32 > (endx - startx, endy - starty) / viewportSize;
    let c : vec2 < f32> = vec2 < f32 > (startx, starty) + vec2 < f32 > (FragCoord.x, viewportSize.y - FragCoord.y) * scale;
    let delta_0: vec2< f32> = vec2< f32> (FragCoord.x * unit_delta.x, FragCoord.y * unit_delta.y);
    //let delta_0 = c;





    var delta_z : vec2 < f32> = vec2 < f32 > (0.0, 0.0);
    var two = vec2 < f32 > (2.0, 0.0);
    var ref_iteration = 0;
    var iteration = 0;
    var z =c;
    var lastZ = x_n[0].value + delta_0;
    var max_sub_iter = 98;

    while(iteration < maxIteration)
    {
        //lastZ = z;
        //delta_z = (two * delta_z * x_n[ref_iteration].value) + (delta_z * delta_z) + delta_0;
        //ref_iteration += 1;
        //z = x_n[ref_iteration].value + delta_z;
        //if(sqrt(dot(z,z)) > 2.0){
        //break;
        //}
        //if(
        //sqrt(dot(z,z)) < sqrt(dot(delta_z, delta_z))
        //||
        //ref_iteration == max_sub_iter){
        //delta_z = z;
        //ref_iteration = 0;
        //}
        //iteration += 1;
        lastZ = z;

        //lculate delta_z component-wise
        let delta_z_x = (2.0 * delta_z.x * x_n[ref_iteration].value.x) + (delta_z.x * delta_z.x) - (delta_z.y * delta_z.y) + delta_0.x;
        let delta_z_y = (2.0 * delta_z.y * x_n[ref_iteration].value.y) + (2.0 * delta_z.x * delta_z.y) + delta_0.y;
        delta_z = vec2(delta_z_x, delta_z_y);

        ref_iteration += 1;

        //lculate z component-wise
        let z_x = x_n[ref_iteration].value.x + delta_z.x;
        let z_y = x_n[ref_iteration].value.y + delta_z.y;
        z = vec2(z_x, z_y);

        //eck if magnitude of z exceeds 2.0
        if (
            dot(z, z) > 4.0
        )
        {
            break;
        }

        //eck if magnitude of z is less than magnitude of delta_z or max_sub_iter reached
        if ((z.x * z.x + z.y * z.y) < (delta_z.x * delta_z.x + delta_z.y * delta_z.y) || ref_iteration == max_sub_iter)
        {
            delta_z = z;
            ref_iteration = 0;
        }

        iteration += 1;

    }



    var mu : f32;
    if(iteration < i32(maxIteration))
    {
        mu = f32(iteration);
    }else{
        mu = f32(maxIteration);
    }

    if(mu == f32(maxIteration))
    {
        return vec4 < f32 > (0.0, 0.0, 0.0, 1.0);
    }
    //shift mue to make the colors more interesting


    let hue : f32 = mix(0.0, 1.0, mu / f32(maxIteration));
    let saturation : f32 = 1.0;
    let lightness : f32 = 0.5;
    let color : vec3 < f32> = hslToRgb(hue, saturation, lightness);
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
