'use client';

// Este componente encapsula a UI atual de geração que estava em /dashboard/generate/page.tsx
// Importa diretamente a página existente para manter a funcionalidade enquanto evitamos duplicação.
// Em uma etapa futura, podemos mover funções internas (tags/sugestões) para hooks.

import GeneratePage from '@/app/dashboard/generate/page';

export default function PromptGeneratorPanel() {
  return <GeneratePage />;
}


