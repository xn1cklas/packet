import { rewriteShellSnippet } from "../shared/commands";
import type { PackagePickerSettings } from "../shared/settings";

type TextRecord = {
  original: string;
  rendered: string;
};

type ElementRecord = {
  original: string;
  rendered: string;
};

const ignoredTags = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "NOSCRIPT",
  "TEMPLATE"
]);

const commandNeedle = /\b(?:npm|npx)\b/u;
const codeLineSelector = "[data-line], .line";

export class DomCommandRewriter {
  readonly #records = new WeakMap<Text, TextRecord>();
  readonly #elementRecords = new WeakMap<Element, ElementRecord>();
  #settings: PackagePickerSettings;

  constructor(settings: PackagePickerSettings) {
    this.#settings = settings;
  }

  updateSettings(settings: PackagePickerSettings): void {
    this.#settings = settings;
    this.rewrite(document.body);
  }

  rewrite(root: ParentNode | null): void {
    if (!root) {
      return;
    }

    this.#rewriteCodeLines(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => this.#acceptTextNode(node)
    });

    while (walker.nextNode()) {
      this.#rewriteText(walker.currentNode as Text);
    }
  }

  #acceptTextNode(node: Node): number {
    if (!(node instanceof Text)) {
      return NodeFilter.FILTER_REJECT;
    }

    const record = this.#records.get(node);
    if (record && node.data === record.rendered) {
      return NodeFilter.FILTER_ACCEPT;
    }

    if (!commandNeedle.test(node.data)) {
      return NodeFilter.FILTER_REJECT;
    }

    const parent = node.parentElement;
    if (!parent || hasIgnoredAncestor(parent)) {
      return NodeFilter.FILTER_REJECT;
    }

    return NodeFilter.FILTER_ACCEPT;
  }

  #rewriteText(node: Text): void {
    const record = this.#records.get(node);
    const original = record && node.data === record.rendered ? record.original : node.data;
    const rendered = rewriteShellSnippet(original, this.#settings);

    if (rendered !== node.data) {
      node.data = rendered;
    }

    this.#records.set(node, { original, rendered });
  }

  #rewriteCodeLines(root: ParentNode): void {
    const elements: Element[] = [];

    if (root instanceof Element && root.matches(codeLineSelector)) {
      elements.push(root);
    }

    elements.push(...root.querySelectorAll(codeLineSelector));

    for (const element of elements) {
      this.#rewriteCodeLine(element);
    }
  }

  #rewriteCodeLine(element: Element): void {
    if (hasIgnoredAncestor(element)) {
      return;
    }

    const record = this.#elementRecords.get(element);
    const current = element.textContent ?? "";
    if (!record && !commandNeedle.test(current)) {
      return;
    }

    const original = record && current === record.rendered ? record.original : current;
    if (!commandNeedle.test(original)) {
      return;
    }

    const rendered = rewriteShellSnippet(original, this.#settings);

    if (rendered !== current) {
      element.textContent = rendered;
    }

    this.#elementRecords.set(element, { original, rendered });
  }
}

function hasIgnoredAncestor(element: Element): boolean {
  let current: Element | null = element;

  while (current) {
    if (ignoredTags.has(current.tagName)) {
      return true;
    }

    if (current.hasAttribute("contenteditable")) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}
