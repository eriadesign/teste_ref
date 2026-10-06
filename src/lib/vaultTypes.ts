import type { Board, Item, Settings } from "./types";

/**
 * Formato da pasta do acervo — o contrato entre o navegador, o servidor e o
 * disco. Fica fora de `lib/server` porque os três lados leem daqui, e é o
 * mesmo formato da versão standalone (`index.html`), então uma pasta gravada
 * lá abre aqui e vice-versa.
 *
 *   <pasta>/
 *   ├─ acervo.json          boards, referências e preferências
 *   └─ imagens/<nome>.webp  uma imagem por referência
 *
 * Quem lê não supõe o nome do arquivo: segue o `image` de cada referência.
 * Este app grava pelo id; a página publicada grava pelo título e guarda ainda
 * `historico/`, `imagensGuardadas` (imagens que só versões antigas citam) e,
 * em cada referência ainda sem imagem, `imagePendente` (o arquivo esperado).
 */

export const VAULT_FILE = "acervo.json";
/**
 * A cópia que o usuário salva no botão — e só ela mexe nesse arquivo.
 *
 * `acervo.json` acompanha o acervo em tempo real, com tudo que isso implica:
 * uma exclusão chega nele em um segundo. Este aqui é o ponto de retorno que a
 * pessoa escolheu, e fica congelado até ela escolher outro. Nenhuma gravação
 * automática o toca — nem uma limpeza, nem uma exclusão em massa.
 */
export const VAULT_RESCUE = "acervo-anterior.json";
export const VAULT_IMAGES = "imagens";
export const VAULT_FORMAT = "referencias/acervo";

/** Item como ele vai pro disco: sem o Blob, com o caminho da imagem. */
export type VaultItem = Omit<Item, "imageBlob"> & { image?: string };

export interface VaultSnapshot {
  format: typeof VAULT_FORMAT;
  version: 1;
  savedAt: string;
  settings?: Partial<Settings>;
  boards: Board[];
  items: VaultItem[];
}

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * O arquivo da imagem se chama como o id da referência. Como o id não é
 * reaproveitado e a capa de uma referência não muda, o nome é estável: dá pra
 * pular o que já está gravado e apagar o que ninguém aponta mais.
 */
export function imageFileName(id: string, mime?: string): string {
  return `${id}.${(mime && EXTENSIONS[mime]) ?? "webp"}`;
}

/**
 * O nome vem do cliente. Sem uma peneira aqui, um nome com `../` faria o
 * servidor escrever fora da pasta.
 *
 * A página publicada nomeia as imagens pelo título da referência ("Logo
 * azul (2).webp"), então espaço, acento e parênteses passam. Barra, os
 * caracteres que o Windows recusa e nome começando com ponto, não: sem
 * separador e sem ponto inicial, o nome nunca sai de `imagens/`.
 */
export function isSafeImageName(name: string): boolean {
  return (
    /^[^.\s/\\<>:"|?*\u0000-\u001f][^/\\<>:"|?*\u0000-\u001f]{0,159}$/u.test(name) &&
    /\.(webp|png|jpg|jpeg|gif|svg)$/i.test(name)
  );
}

/** Extrai o nome do arquivo de um `imagens/<nome>` vindo do cliente. */
export function imageNameOf(reference: string | undefined): string | null {
  if (!reference) return null;
  const name = reference.split("/").pop() ?? "";
  return isSafeImageName(name) ? name : null;
}
