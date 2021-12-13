export const createShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const msg = gl.getShaderInfoLog(shader)!;

  if (msg.length > 0) {
    throw new Error(msg);
  }

  return shader;
};
