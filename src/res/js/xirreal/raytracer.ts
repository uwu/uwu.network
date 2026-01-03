// CONSTANTS
const CONTAINER_ID = "raytracer",
	PAUSE_B_ID = "raytracer-stop",
	GROUND_B_ID = "raytracer-ground",
	DEPTH_B_ID = "raytracer-bitdepth",
	HIDEUI_B_ID = "raytracer-ui",
	NAME_DIV_ID = "user";

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_moving;
uniform float u_bitDepth;

const vec3 UP_DIR = vec3(0.0, 1.0, 0.0);
const vec3 SUN_DIR = normalize(vec3(-0.5, 0.7, -0.4));
const float PLANE_Y = -1.0;
const float BIAS = 0.001;

// Standard 2x2 Bayer Matrix for Ordered Dithering
// [ 0, 2 ]
// [ 3, 1 ] * (1/4)
float bayer2x2(vec2 position) {
    int x = int(mod(position.x, 2.0));
    int y = int(mod(position.y, 2.0));

    if (x == 0 && y == 0) return 0.0;
    if (x == 1 && y == 0) return 0.5;
    if (x == 0 && y == 1) return 0.75;
    return 0.25; // x=1, y=1
}

float raySphereCast(vec3 ro, vec3 rd, vec3 center, float radius) {
    vec3 oc = ro - center;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - radius * radius;
    float h = b * b - c;

    if (h < 0.0) return -1.0;

    float t = -b - sqrt(h);
    return t;
}

float rayPlaneCast(vec3 ro, vec3 rd, float planeHeight) {
    if (abs(rd.y) < 1e-4) return -1.0;
    float t = (planeHeight - ro.y) / rd.y;
    return t > 0.0 ? t : -1.0;
}

float groundColor(vec3 point, float frameCounter) {
    float movement = (frameCounter * 0.02) * u_moving;
    float fX = floor(point.x + 0.5);
    float fZ = floor(point.z - movement);
    float checker = mod(fX + fZ, 2.0);

    return mix(0.6, 1.0, checker);
}

float getLighting(vec3 rayOrigin, vec3 rayDirection, vec3 sphereCenter, float sphereRadius, float frameCounter) {
    float tPlane = rayPlaneCast(rayOrigin, rayDirection, PLANE_Y);

    if (tPlane < 0.0) {
        float sky = max(0.0, dot(rayDirection, UP_DIR));
        float sun = pow(max(0.0, dot(rayDirection, SUN_DIR)), 16.0) * 1.2;
        return sky + sun;
    }

    vec3 hitPoint = rayOrigin + rayDirection * tPlane;

    float tShadow = raySphereCast(hitPoint + SUN_DIR * BIAS, SUN_DIR, sphereCenter, sphereRadius);
    float shadow = (tShadow > 0.0) ? 0.2 : 1.0;

    float distToSphere = distance(hitPoint, sphereCenter);
    float attenuation = smoothstep(16.0, 0.0, distToSphere);

    float col = groundColor(hitPoint, frameCounter);

    return col * shadow * attenuation;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;

    vec3 rayOrigin = vec3(0.0, 1.8, -5.0);
    vec3 rayDirection = normalize(vec3(p.x, p.y - 0.45, 1.25));

    vec3 sphereCenter = vec3(cos(u_time * 0.03), sin(u_time * 0.05) * 0.5 + 0.5, 0.2 * sin(u_time * 0.03));
    float sphereRadius = 1.0;

    float tSphere = raySphereCast(rayOrigin, rayDirection, sphereCenter, sphereRadius);

    float finalColor = 0.0;

    if (tSphere > 0.0) {
        vec3 hitPoint = rayOrigin + rayDirection * tSphere;
        vec3 normal = normalize(hitPoint - sphereCenter);

        float fresnel = pow(1.0 - max(0.0, dot(normal, -rayDirection)), 3.0);

        vec3 reflectDir = reflect(rayDirection, normal);
        float reflection = getLighting(hitPoint + normal * BIAS, reflectDir, sphereCenter, sphereRadius, u_time);

        finalColor = mix(reflection * 0.4, reflection * 0.7, fresnel);
    } else {
        finalColor = getLighting(rayOrigin, rayDirection, sphereCenter, sphereRadius, u_time);
    }

    float levels = pow(2.0, u_bitDepth);
    float threshold = bayer2x2(gl_FragCoord.xy);

    float scaledColor = finalColor * (levels - 1.0);
    float quantized = floor(scaledColor + threshold);

    finalColor = quantized / (levels - 1.0);
    gl_FragColor = vec4(vec3(clamp(finalColor, 0.0, 1.0)), 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
	const program = gl.createProgram()!;
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		return null;
	}
	return program;
}

export default () => {
	const canvas = document.getElementById(CONTAINER_ID) as HTMLCanvasElement;
	const gl = canvas.getContext("webgl");

	if (!gl) {
		console.error("WebGL not supported");
		return;
	}

	// Set pixelated rendering
	canvas.style.imageRendering = "pixelated";

	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!;
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)!;
	const program = createProgram(gl, vertexShader, fragmentShader)!;

	const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	const timeUniformLocation = gl.getUniformLocation(program, "u_time");
	const movingUniformLocation = gl.getUniformLocation(program, "u_moving");
	const bitDepthUniformLocation = gl.getUniformLocation(program, "u_bitDepth");

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// Two triangles covering the screen
	const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	let bitDepth = 4;
	let moving = 1.0;
	let frameCounter = 0;
	let rendering = true;
	let uiHidden = false;

	let lastTime = 0;

	const cellSize = 4;

	function resize() {
		const width = Math.floor(window.innerWidth / cellSize) - 1;
		const height = Math.floor(window.innerHeight / cellSize) - 1;

		canvas.width = width;
		canvas.height = height;
		lastTime = 0;
		gl!.viewport(0, 0, width, height);
	}

	window.addEventListener("resize", resize);
	resize();

	// UI Logic
	const pauseButton = document.getElementById(PAUSE_B_ID)!;
	pauseButton.onclick = () => {
		rendering = !rendering;
		pauseButton.innerText = pauseButton.innerText === "resume" ? "pause" : "resume";
		if (rendering) requestAnimationFrame(loop);
	};

	const nameBar = document.getElementById(NAME_DIV_ID)!;
	const uiButton = document.getElementById(HIDEUI_B_ID)!;
	uiButton.onclick = () => {
		uiHidden = !uiHidden;
		if (uiHidden) {
			nameBar.classList.add("opacity-0");
			uiButton.innerText = "show";
		} else {
			nameBar.classList.remove("opacity-0");
			uiButton.innerText = "hide";
		}
	};

	const groundButton = document.getElementById(GROUND_B_ID)!;
	groundButton.onclick = () => {
		moving = (moving + 1) % 2;
		groundButton.innerText = moving === 1.0 ? "moving ground: true" : "moving ground: false";
	};

	const depthButton = document.getElementById(DEPTH_B_ID)!;
	depthButton.onclick = () => {
		bitDepth++;
		if (bitDepth == 9) bitDepth = 1;
		depthButton.innerText = "bitdepth: " + bitDepth;
	};

	const fpsInterval = 1000 / 60;

	function loop(timestamp: number) {
		if (!rendering) return;

		const elapsed = timestamp - lastTime;

		if (elapsed > fpsInterval) {
			lastTime = timestamp - (elapsed % fpsInterval);

			gl!.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
			gl!.uniform1f(timeUniformLocation, frameCounter);
			gl!.uniform1f(movingUniformLocation, moving);
			gl!.uniform1f(bitDepthUniformLocation, bitDepth);

			gl!.drawArrays(gl!.TRIANGLES, 0, 6);

			frameCounter++;
		}

		requestAnimationFrame(loop);
	}

	gl!.useProgram(program);

	gl!.enableVertexAttribArray(positionAttributeLocation);
	gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer);
	gl!.vertexAttribPointer(positionAttributeLocation, 2, gl!.FLOAT, false, 0, 0);

	requestAnimationFrame(loop);
};
