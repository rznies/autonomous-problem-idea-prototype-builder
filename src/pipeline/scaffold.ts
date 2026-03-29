import type { IdeaCandidate, PrototypeScaffold, PrototypeStack } from './contracts.js';

function routeStack(idea: IdeaCandidate): PrototypeStack {
  return idea.complexity === 'moderate' ? 'vite-typescript' : 'node-html';
}

function buildNodeHtmlScaffold(idea: IdeaCandidate): PrototypeScaffold {
  return {
    policyVersion: 'scaffold-v1',
    stack: 'node-html',
    files: [
      {
        path: 'index.html',
        contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${idea.name}</title>
  </head>
  <body>
    <main>
      <h1>${idea.name}</h1>
      <p>${idea.description}</p>
      <p><strong>Core path:</strong> ${idea.coreValuePath}</p>
    </main>
  </body>
</html>
`,
      },
      {
        path: 'package.json',
        contents: `{
  "name": "prototype-node-html",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node -e \"console.log('prototype ready')\"",
    "smoke": "node -e \"console.log('smoke ok')\""
  }
}
`,
      },
    ],
    runCommand: 'npm run start',
    smokeCommand: 'npm run smoke',
  };
}

function buildViteTypeScriptScaffold(idea: IdeaCandidate): PrototypeScaffold {
  return {
    policyVersion: 'scaffold-v1',
    stack: 'vite-typescript',
    files: [
      {
        path: 'package.json',
        contents: `{
  "name": "prototype-vite-typescript",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "smoke": "node -e \"console.log('smoke ok')\""
  },
  "devDependencies": {
    "typescript": "^6.0.2",
    "vite": "^7.1.7"
  }
}
`,
      },
      {
        path: 'index.html',
        contents: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${idea.name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
      },
      {
        path: 'src/main.ts',
        contents: `const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = ` + "`<main><h1>${idea.name}</h1><p>${idea.description}</p><p><strong>Core path:</strong> ${idea.coreValuePath}</p></main>`" + `;
}
`,
      },
      {
        path: 'tsconfig.json',
        contents: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src"]
}
`,
      },
    ],
    runCommand: 'npm run dev',
    smokeCommand: 'npm run smoke',
  };
}

export function scaffoldPrototype(idea: IdeaCandidate): PrototypeScaffold {
  const stack = routeStack(idea);
  return stack === 'node-html' ? buildNodeHtmlScaffold(idea) : buildViteTypeScriptScaffold(idea);
}
