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
  const checkers: {f: DeclarationReflection; parent: DeclarationReflection}[] = [];

  /**
   * convert export function's method to function.
   */
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
          const superParent = parent.parent!!.parent!! as DeclarationReflection;
          checkers.push({f: method, parent: superParent});
        } else {
          const newReflection = new DeclarationReflection(method.name, ReflectionKind.Function, context.scope);
          newReflection.signatures = method.signatures;
          project.children?.push(newReflection);
          context.registerReflection(newReflection, undefined);
          const superParent = parent.parent!!.parent!! as DeclarationReflection;
          checkers.push({f: newReflection, parent: superParent});
        }
      }
    });
  });

  /**
   * convert exported method's category.
   */
  app.converter.on(Converter.EVENT_RESOLVE_END, (context: Context) => {
    const project = context.project;
    checkers.forEach(({f, parent}) => {
      if (project.categories) {
        const beforeCategory = project.categories.find(category => category.children.includes(f))!!;
        beforeCategory.children = beforeCategory.children.filter(child => child !== f);
        if (!beforeCategory.children.length) project.categories = project.categories.filter(c => c !== beforeCategory);
        project.categories.find(category => category.children.includes(parent))?.children.push(f);
      } else if (project.groups) {
        const group = project.groups.find(group => group.title === 'Functions')!!;
        if (!group.categories) return;

        const beforeCategory = group.categories.find(category => category.children.includes(f))!!;
        beforeCategory.children = beforeCategory.children.filter(child => child !== f);
        if (!beforeCategory.children.length) group.categories = group.categories.filter(c => c !== beforeCategory);
        group.categories.find(category => category.children.includes(parent))?.children.push(f);
      }
    });
  });
}

function isInsideOnExportFunction(parent: Reflection, names: string[]) {
  return names.includes(parent.name) || (parent.kindOf(ReflectionKind.TypeLiteral) && names.includes(parent.parent!!.name));
}
