import { ConstructLevel } from '../types';

export interface CodeSnippet {
  label: string;
  detail: string;
  code: string;
}

export interface ImportSnippet {
  label: string;
  detail: string;
  code: string;
}

export function getConstructSnippets(level: ConstructLevel): CodeSnippet[] {
  const baseSnippets: CodeSnippet[] = [
    {
      label: 'useState',
      detail: 'React state hook',
      code: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});'
    },
    {
      label: 'useEffect',
      detail: 'React effect hook',
      code: 'useEffect(() => {\n  ${1:// effect}\n  return () => {\n    ${2:// cleanup}\n  };\n}, [${3:deps}]);'
    },
    {
      label: 'component',
      detail: 'React functional component',
      code: 'export const ${1:ComponentName} = ({ ${2:props} }) => {\n  return (\n    <div>\n      ${3:// content}\n    </div>\n  );\n};'
    }
  ];

  const levelSpecificSnippets: Record<ConstructLevel, CodeSnippet[]> = {
    L0: [
      {
        label: 'l0-primitive',
        detail: 'L0 primitive component',
        code: `export const PrimitiveName = ({ props }) => {
  // L0: Pure, atomic component with no external dependencies
  return (
    <div className="styles">
      {/* content */}
    </div>
  );
};`
      },
      {
        label: 'l0-hook',
        detail: 'L0 primitive hook',
        code: `export const useHookName = (params) => {
  // L0: Pure logic with no external dependencies
  const [state, setState] = useState(initialValue);
  
  const methodName = useCallback(() => {
    // logic
  }, [deps]);
  
  return { state, methodName };
};`
      }
    ],
    L1: [
      {
        label: 'l1-configured',
        detail: 'L1 configured component',
        code: `import { L0Component } from '../L0/category/L0Component';

export const ConfiguredComponent = ({ props }) => {
  // L1: Configured L0 primitive with preset values
  return (
    <L0Component
      // configured props
      {...props}
    />
  );
};`
      },
      {
        label: 'l1-composite',
        detail: 'L1 composite component',
        code: `import { L0Component1, L0Component2 } from '../L0';

export const CompositeComponent = ({ props }) => {
  // L1: Composition of L0 primitives
  return (
    <div>
      <L0Component1 {...props1} />
      <L0Component2 {...props2} />
    </div>
  );
};`
      }
    ],
    L2: [
      {
        label: 'l2-pattern',
        detail: 'L2 pattern component',
        code: `import { L1Component1, L1Component2 } from '../L1';
import { usePatternHook } from '../hooks';

export const PatternComponent = ({ props }) => {
  // L2: Reusable pattern combining L1 constructs
  const { state, handlers } = usePatternHook();
  
  return (
    <div>
      <L1Component1 {...props1} />
      <L1Component2 {...props2} />
    </div>
  );
};`
      },
      {
        label: 'l2-context',
        detail: 'L2 context provider',
        code: `import { createContext, useContext, ReactNode } from 'react';

const ContextNameContext = createContext<ContextType | undefined>(undefined);

export const ContextNameProvider = ({ children }: { children: ReactNode }) => {
  // L2: Pattern for state management
  const [state, setState] = useState(initialState);
  
  const value = {
    state,
    actions
  };
  
  return (
    <ContextNameContext.Provider value={value}>
      {children}
    </ContextNameContext.Provider>
  );
};

export const useContextName = () => {
  const context = useContext(ContextNameContext);
  if (!context) {
    throw new Error('useContextName must be used within ContextNameProvider');
  }
  return context;
};`
      }
    ],
    L3: [
      {
        label: 'l3-feature',
        detail: 'L3 feature component',
        code: `import { L2Pattern1, L2Pattern2 } from '../L2';
import { FeatureProvider } from './providers';
import { useFeatureStore } from './stores';

export const FeatureName = () => {
  // L3: Complete feature combining multiple patterns
  const { state, actions } = useFeatureStore();
  
  return (
    <FeatureProvider>
      <div className="feature-container">
        <L2Pattern1 />
        <L2Pattern2 />
      </div>
    </FeatureProvider>
  );
};`
      },
      {
        label: 'l3-app',
        detail: 'L3 application shell',
        code: `import { Feature1, Feature2, Feature3 } from './features';
import { AppProvider } from './providers';
import { Router, Route } from './routing';

export const AppName = () => {
  // L3: Complete application
  return (
    <AppProvider>
      <Router>
        <Route path="/feature1" element={<Feature1 />} />
        <Route path="/feature2" element={<Feature2 />} />
        <Route path="/feature3" element={<Feature3 />} />
      </Router>
    </AppProvider>
  );
};`
      }
    ]
  };

  return [...baseSnippets, ...(levelSpecificSnippets[level] || [])];
}

export function getConstructImports(level: ConstructLevel): ImportSnippet[] {
  const baseImports: ImportSnippet[] = [
    {
      label: 'import React',
      detail: 'Import React',
      code: "import React from 'react';"
    },
    {
      label: 'import hooks',
      detail: 'Import React hooks',
      code: "import { useState, useEffect, useCallback, useMemo } from 'react';"
    },
    {
      label: 'import types',
      detail: 'Import TypeScript types',
      code: "import type { FC, ReactNode, PropsWithChildren } from 'react';"
    }
  ];

  const levelSpecificImports: Record<ConstructLevel, ImportSnippet[]> = {
    L0: [
      {
        label: 'import base',
        detail: 'Import base construct',
        code: "import { BaseConstruct } from '../../base/BaseConstruct';"
      },
      {
        label: 'import L0 base',
        detail: 'Import L0 base class',
        code: "import { L0Construct } from '../../base/L0Construct';"
      }
    ],
    L1: [
      {
        label: 'import L0',
        detail: 'Import L0 constructs',
        code: "import { /* L0 constructs */ } from '../L0';"
      },
      {
        label: 'import L1 base',
        detail: 'Import L1 base class',
        code: "import { L1Construct } from '../../base/L1Construct';"
      }
    ],
    L2: [
      {
        label: 'import L1',
        detail: 'Import L1 constructs',
        code: "import { /* L1 constructs */ } from '../L1';"
      },
      {
        label: 'import L2 base',
        detail: 'Import L2 base class',
        code: "import { L2Construct } from '../../base/L2Construct';"
      },
      {
        label: 'import patterns',
        detail: 'Import common patterns',
        code: "import { usePattern, withPattern } from '../patterns';"
      }
    ],
    L3: [
      {
        label: 'import L2',
        detail: 'Import L2 patterns',
        code: "import { /* L2 patterns */ } from '../L2';"
      },
      {
        label: 'import L3 base',
        detail: 'Import L3 base class',
        code: "import { L3Construct } from '../../base/L3Construct';"
      },
      {
        label: 'import providers',
        detail: 'Import providers',
        code: "import { AppProvider, FeatureProvider } from './providers';"
      },
      {
        label: 'import stores',
        detail: 'Import stores',
        code: "import { useAppStore, useFeatureStore } from './stores';"
      }
    ]
  };

  return [...baseImports, ...(levelSpecificImports[level] || [])];
}