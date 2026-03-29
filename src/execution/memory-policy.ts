import type { PrototypeStack } from './contracts.js';

const STACK_MEMORY_MB: Readonly<Record<PrototypeStack, number>> = {
  'node-html': 2048,
  'vite-ts': 4096,
};

export function getSandboxMemoryMb(stack: PrototypeStack): number {
  return STACK_MEMORY_MB[stack];
}
