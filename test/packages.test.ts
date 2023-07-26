import * as ts from 'typescript';
import {join} from 'path';
import {Application, DocumentationEntryPoint, LogLevel, TSConfigReader} from 'typedoc';
import {test} from 'vitest';
import {load} from '..';

const app = new Application();
app.options.addReader(new TSConfigReader());
app.bootstrap({
  tsconfig: join(__dirname, 'packages', 'tsconfig.json'),
  excludeExternals: true,
  logLevel: LogLevel.Warn,
});
load(app);

const program = ts.createProgram(app.options.getFileNames(), app.options.getCompilerOptions());

test('export function', async () => {
  app.options.setValue('exportFunctions', ['test']);
  const entry: DocumentationEntryPoint = {
    displayName: 'none',
    program,
    sourceFile: program.getSourceFile(join(__dirname, 'packages/export-function/index.ts'))!,
  };

  const project = await app.converter.convert([entry]);
  await app.generateJson(project, 'test/output/export-function.json');
  await app.generateDocs(project, 'test/output/template/export-function');
});

test('export async function', async () => {
  app.options.setValue('exportFunctions', ['testAsync']);
  const entry: DocumentationEntryPoint = {
    displayName: 'none',
    program,
    sourceFile: program.getSourceFile(join(__dirname, 'packages/export-async-function/index.ts'))!,
  };

  const project = await app.converter.convert([entry]);
  await app.generateJson(project, 'test/output/export-async-function.json');
  await app.generateDocs(project, 'test/output/template/export-async-function');
});

test('not export function', async () => {
  app.options.setValue('exportFunctions', ['test']);
  const entry: DocumentationEntryPoint = {
    displayName: 'none',
    program,
    sourceFile: program.getSourceFile(join(__dirname, 'packages/not-export-function/index.ts'))!,
  };

  const project = await app.converter.convert([entry]);
  await app.generateJson(project, 'test/output/not-export-function.json');
  await app.generateDocs(project, 'test/output/template/not-export-function');
});
