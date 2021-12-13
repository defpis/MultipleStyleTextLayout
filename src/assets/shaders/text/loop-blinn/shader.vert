#version 300 es
precision highp float;

in vec2 iPos;
in vec3 iKLM;
out vec3 vKLM;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

void main() {
  vKLM = iKLM;

  gl_Position =
      vec4((projectionMatrix * translationMatrix * vec3(iPos, 1.0)), 1.0);
}