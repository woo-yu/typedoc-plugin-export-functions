import {Application, Context, Converter, ReflectionKind, DeclarationReflection, ParameterType, SignatureReflection, ReferenceType, Reflection} from 'typedoc';

declare module 'typedoc' {
  export interface TypeDocOptionMap {
    exportFunctions: string[];
  }
}

export function load(app: Application) {
  app.options.addDeclaration({
    name: 'exportFunctions',
    help: "it can export function's return function(signature) to function(declaration). input the function's name",
    type: ParameterType.Array,
    defaultValue: [],
  });

  app.converter.on(Converter.EVENT_RESOLVE_BEGIN, (context: Context) => {
    const names = context.converter.application.options.getValue('exportFunctions');
    const methods = context.project.getReflectionsByKind(ReflectionKind.Method);
    const project = context.project;

    methods?.forEach(method => {
      const parent = method.parent;
      if (method instanceof DeclarationReflection && parent && isInsideOnExportFunction(parent, names)) {
        if (parent.parent!! instanceof SignatureReflection && parent.parent!!.type instanceof ReferenceType) {
          method.kind = ReflectionKind.Function;
          project.children?.push(method);
        } else {
          const newReflection = new DeclarationReflection(method.name, ReflectionKind.Function, context.scope);
          newReflection.signatures = method.signatures;
          project.children?.push(newReflection);
          context.registerReflection(newReflection, undefined);
        }
      }
    });
  });
}

function isInsideOnExportFunction(parent: Reflection, names: string[]) {
  return names.includes(parent.name) || (parent.kindOf(ReflectionKind.TypeLiteral) && names.includes(parent.parent!!.name));
}
