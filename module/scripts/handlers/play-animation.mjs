/**
 * play_animation — Reproduce una animación via Sequencer + JB2A.
 *
 * args: {
 *   tokenId: string,        // ID del token donde reproducir
 *   file: string,           // ruta del archivo .webm (JB2A)
 *   scale?: number,         // escala (default: 1)
 *   tint?: string,          // color de tinte hex (ej. "#cc0000")
 *   persist?: boolean,      // efecto persistente (default: false)
 *   belowTokens?: boolean,  // debajo de tokens (default: true)
 *   fadeIn?: number,        // fade in ms (default: 0)
 *   fadeOut?: number,       // fade out ms (default: 0)
 *   stretchToTokenId?: string, // estirar hacia otro token
 *   delay?: number,         // delay antes de empezar ms (default: 0)
 *   name?: string,          // nombre del efecto (para referenciar)
 * }
 *
 * Returns: { ok: boolean, tokenId, file }
 */
export async function playAnimation({
  tokenId,
  file,
  scale = 1,
  tint,
  persist = false,
  belowTokens = true,
  fadeIn = 0,
  fadeOut = 0,
  stretchToTokenId,
  delay = 0,
  name,
}) {
  if (!game.modules.get("sequencer")?.active) {
    throw new Error("Sequencer no está activo.");
  }

  const token = canvas.tokens.get(tokenId);
  if (!token) throw new Error(`Token "${tokenId}" no encontrado.`);

  let seq = new Sequence().effect().file(file).atLocation(token);

  if (stretchToTokenId) {
    const target = canvas.tokens.get(stretchToTokenId);
    if (!target) throw new Error(`Token target "${stretchToTokenId}" no encontrado.`);
    seq = seq.stretchTo(target);
  }

  if (scale !== 1) seq = seq.scale(scale);
  if (tint) seq = seq.tint(tint);
  if (delay) seq = seq.delay(delay);
  if (fadeIn) seq = seq.fadeIn(fadeIn);
  if (fadeOut) seq = seq.fadeOut(fadeOut);
  if (belowTokens) seq = seq.belowTokens();
  if (persist) seq = seq.persist(true, { name: name ?? `anim-${tokenId}-${Date.now()}` });

  await seq.play();

  return { ok: true, tokenId, file, persist, name };
}
