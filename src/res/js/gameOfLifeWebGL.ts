import { createFullscreenQuad, createProgram, createShader, createTextureAndFramebuffer } from "@res/js/gl-utils";
import { default as oldGOL } from "@res/js/gameOfLife";

const CONTAINER_ID = "gol",
	SIMPLE_CLASS = "gol-simple",
	SIMPLE_B_ID = "gol-fade",
	RAND_B_ID = "gol-rand",
	PAUSE_B_ID = "gol-stop",
	CLEAR_B_ID = "gol-clear",
	RAND_THRES = 0.8;

const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = (a_position + 1.0) * 0.5;
}
`;

const simFragmentShaderSource = `
precision mediump float;
uniform sampler2D u_state;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 onePixel = 1.0 / u_resolution;

    float neighbors = 0.0;

    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2(-1.0, -1.0))).r;
    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2( 0.0, -1.0))).r;
    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2( 1.0, -1.0))).r;
    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2(-1.0,  0.0))).r;
    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2( 1.0,  0.0))).r;
    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2(-1.0,  1.0))).r;
    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2( 0.0,  1.0))).r;
    neighbors += texture2D(u_state, fract(v_texCoord + onePixel * vec2( 1.0,  1.0))).r;

    float current = texture2D(u_state, v_texCoord).r;
    float next = 0.0;

    if (current > 0.5) {
        if (neighbors > 1.9 && neighbors < 3.1) {
            next = 1.0;
        }
    } else {
        if (neighbors > 2.9 && neighbors < 3.1) {
            next = 1.0;
        }
    }

    gl_FragColor = vec4(vec3(next), 1.0);
}
`;

const copyFragmentShaderSource = `
precision lowp float;
uniform sampler2D u_state;
varying vec2 v_texCoord;
void main() {
    gl_FragColor = vec4(texture2D(u_state, v_texCoord).rgb, 1.0);
}
`;

const fadeFragmentShaderSource = `
precision mediump float;
uniform sampler2D u_currentSim;
uniform sampler2D u_prevDisplay;
uniform float u_dt;
uniform float u_fadeTime;
varying vec2 v_texCoord;

void main() {
    float target = texture2D(u_currentSim, v_texCoord).r;
    float current = texture2D(u_prevDisplay, v_texCoord).r;

    float diff = target - current;
    float step = (1.0 / u_fadeTime) * u_dt;

    float next = current;
    if (abs(diff) < step) {
        next = target;
    } else {
        next = current + sign(diff) * step;
    }

    gl_FragColor = vec4(vec3(next), 1.0);
}
`;

export default (cellWidth: number, cellHeight: number) => {
	const canvas = document.getElementById(CONTAINER_ID) as HTMLCanvasElement;
	const gl = canvas.getContext("webgl");

	if (!gl) {
		console.error("WebGL not supported, falling back to old implementation");
		oldGOL(cellWidth, cellHeight);
		return;
	}

	canvas.style.imageRendering = "pixelated";

	// Shaders
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!;
	const simFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, simFragmentShaderSource)!;
	const copyFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, copyFragmentShaderSource)!;
	const fadeFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fadeFragmentShaderSource)!;

	// Programs
	const simProgram = createProgram(gl, vertexShader, simFragmentShader)!;
	const copyProgram = createProgram(gl, vertexShader, copyFragmentShader)!;
	const fadeProgram = createProgram(gl, vertexShader, fadeFragmentShader)!;

	const positionBuffer = createFullscreenQuad(gl);

	const simPosLoc = gl.getAttribLocation(simProgram, "a_position");
	const simStateLoc = gl.getUniformLocation(simProgram, "u_state");
	const simResLoc = gl.getUniformLocation(simProgram, "u_resolution");

	const copyPosLoc = gl.getAttribLocation(copyProgram, "a_position");
	const copyStateLoc = gl.getUniformLocation(copyProgram, "u_state");

	const intPosLoc = gl.getAttribLocation(fadeProgram, "a_position");
	const intSimLoc = gl.getUniformLocation(fadeProgram, "u_currentSim");
	const intDisLoc = gl.getUniformLocation(fadeProgram, "u_prevDisplay");
	const intDtLoc = gl.getUniformLocation(fadeProgram, "u_dt");
	const intFadeLoc = gl.getUniformLocation(fadeProgram, "u_fadeTime");

	// Buffers
	// We need:
	// 2 buffers for simulation ping-pong (read current, write next)
	// 2 buffers for display ping-pong (read previous display, write next display)
	let simTextures: WebGLTexture[] = [];
	let simFBs: WebGLFramebuffer[] = [];
	let displayTextures: WebGLTexture[] = [];
	let displayFBs: WebGLFramebuffer[] = [];

	let width = 0;
	let height = 0;

	function randomize() {
		const size = width * height * 4;
		const data = new Uint8Array(size);
		for (let i = 0; i < size; i += 4) {
			const val = Math.random() > RAND_THRES ? 255 : 0;
			data[i] = val;
			data[i + 1] = val;
			data[i + 2] = val;
			data[i + 3] = 255; // alpha
		}

		[...simTextures, ...displayTextures].forEach((tex) => {
			gl!.bindTexture(gl!.TEXTURE_2D, tex);
			gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, width, height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, data);
		});
	}

	function clear() {
		const size = width * height * 4;
		const data = new Uint8Array(size);
		for (let i = 0; i < size; i += 4) {
			data[i + 3] = 255;
		}

		[...simTextures, ...displayTextures].forEach((tex) => {
			gl!.bindTexture(gl!.TEXTURE_2D, tex);
			gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, width, height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, data);
		});
	}

	function resize() {
		width = Math.floor(window.innerWidth / cellWidth);
		height = Math.floor(window.innerHeight / cellHeight);

		canvas.width = width;
		canvas.height = height;
		gl!.viewport(0, 0, width, height);

		[...simTextures, ...displayTextures].forEach((t) => gl!.deleteTexture(t));
		[...simFBs, ...displayFBs].forEach((f) => gl!.deleteFramebuffer(f));
		simTextures = [];
		simFBs = [];
		displayTextures = [];
		displayFBs = [];

		for (let i = 0; i < 2; i++) {
			const sim = createTextureAndFramebuffer(gl!, width, height);
			simTextures.push(sim.tex);
			simFBs.push(sim.fb);

			const display = createTextureAndFramebuffer(gl!, width, height);
			displayTextures.push(display.tex);
			displayFBs.push(display.fb);
		}

		randomize();
	}

	window.addEventListener("resize", resize);
	resize();

	let simCount = 0;
	let displayCount = 0;
	let lastTick = 0;
	let lastFrame = 0;
	let paused = false;
	const simTickRate = 100;
	const fadeTime = 250;
	let simpleMode = false;

	function loop(timestamp: number) {
		requestAnimationFrame(loop);

		if (lastFrame === 0) lastFrame = timestamp;
		const dt = timestamp - lastFrame;
		lastFrame = timestamp;

		if (!paused) {
			const elapsed = timestamp - lastTick;
			if (elapsed >= simTickRate) {
				lastTick = timestamp;

				const currentSimIdx = simCount % 2;
				const nextSimIdx = (simCount + 1) % 2;

				gl!.useProgram(simProgram);
				gl!.bindFramebuffer(gl!.FRAMEBUFFER, simFBs[nextSimIdx]);
				gl!.viewport(0, 0, width, height);

				gl!.activeTexture(gl!.TEXTURE0);
				gl!.bindTexture(gl!.TEXTURE_2D, simTextures[currentSimIdx]);
				gl!.uniform1i(simStateLoc, 0);
				gl!.uniform2f(simResLoc, width, height);

				gl!.enableVertexAttribArray(simPosLoc);
				gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer);
				gl!.vertexAttribPointer(simPosLoc, 2, gl!.FLOAT, false, 0, 0);

				gl!.drawArrays(gl!.TRIANGLES, 0, 6);

				simCount++;
			}
		}

		const currentSimIdx = simCount % 2;
		const currentDisplayIdx = displayCount % 2;
		const nextDisplayIdx = (displayCount + 1) % 2;

		if (simpleMode) {
			gl!.useProgram(copyProgram);
			gl!.bindFramebuffer(gl!.FRAMEBUFFER, displayFBs[nextDisplayIdx]);
			gl!.viewport(0, 0, width, height);

			gl!.activeTexture(gl!.TEXTURE0);
			gl!.bindTexture(gl!.TEXTURE_2D, simTextures[currentSimIdx]);
			gl!.uniform1i(copyStateLoc, 0);

			gl!.enableVertexAttribArray(copyPosLoc);
			gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer);
			gl!.vertexAttribPointer(copyPosLoc, 2, gl!.FLOAT, false, 0, 0);

			gl!.drawArrays(gl!.TRIANGLES, 0, 6);
		} else {
			gl!.useProgram(fadeProgram);
			gl!.bindFramebuffer(gl!.FRAMEBUFFER, displayFBs[nextDisplayIdx]); // Output
			gl!.viewport(0, 0, width, height);

			gl!.activeTexture(gl!.TEXTURE0);
			gl!.bindTexture(gl!.TEXTURE_2D, simTextures[currentSimIdx]); // Fade to
			gl!.uniform1i(intSimLoc, 0);

			gl!.activeTexture(gl!.TEXTURE1);
			gl!.bindTexture(gl!.TEXTURE_2D, displayTextures[currentDisplayIdx]); // From
			gl!.uniform1i(intDisLoc, 1);

			gl!.uniform1f(intDtLoc, dt);
			gl!.uniform1f(intFadeLoc, fadeTime);

			gl!.enableVertexAttribArray(intPosLoc);
			gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer);
			gl!.vertexAttribPointer(intPosLoc, 2, gl!.FLOAT, false, 0, 0);

			gl!.drawArrays(gl!.TRIANGLES, 0, 6);
		}

		displayCount++;

		gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
		gl!.viewport(0, 0, width, height);

		gl!.useProgram(copyProgram);
		gl!.activeTexture(gl!.TEXTURE0);
		gl!.bindTexture(gl!.TEXTURE_2D, displayTextures[nextDisplayIdx]);
		gl!.uniform1i(copyStateLoc, 0);

		gl!.enableVertexAttribArray(copyPosLoc);
		gl!.bindBuffer(gl!.ARRAY_BUFFER, positionBuffer);
		gl!.vertexAttribPointer(copyPosLoc, 2, gl!.FLOAT, false, 0, 0);

		gl!.drawArrays(gl!.TRIANGLES, 0, 6);
	}

	requestAnimationFrame(loop);

	const simpleBtn = document.getElementById(SIMPLE_B_ID);
	if (simpleBtn)
		simpleBtn.onclick = () => {
			simpleMode = !simpleMode;
			canvas.classList.toggle(SIMPLE_CLASS, simpleMode);
		};

	const randBtn = document.getElementById(RAND_B_ID);
	if (randBtn) randBtn.onclick = () => randomize();

	const pauseBtn = document.getElementById(PAUSE_B_ID);
	if (pauseBtn)
		pauseBtn.onclick = () => {
			paused = !paused;
			pauseBtn.innerText = paused ? "play" : "pause";
		};

	const clearBtn = document.getElementById(CLEAR_B_ID);
	if (clearBtn) clearBtn.onclick = () => clear();
};
