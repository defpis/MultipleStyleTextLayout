#version 300 es
precision highp float;

in vec3 vKLM;
out vec4 oColor;

void main() {
  vec3 px = dFdx(vKLM);
  vec3 py = dFdy(vKLM);

  float k2 = vKLM.x * vKLM.x;
  float c = k2 * vKLM.x - vKLM.y * vKLM.z;
  float k23 = 3.0 * k2;

  float cx = k23 * px.x - vKLM.z * px.y - vKLM.y * px.z;
  float cy = k23 * py.x - vKLM.z * py.y - vKLM.y * py.z;

  float sd = c / sqrt(cx * cx + cy * cy);

  float a = 1.0 - sd;

  if (a > 0.0) {
    float alpha = smoothstep(0.0, 2.0, a);
    oColor = vec4(0.0, 0.0, 0.0, alpha);
  } else {
    discard;
  }
}