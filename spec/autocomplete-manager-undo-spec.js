var import_spec_helper = require("./spec-helper");
describe("Autocomplete Manager", () => {
  let editorView;
  let editor;
  let mainModule;
  beforeEach(() => {
    atom.config.set("autocomplete-plus.enableAutoActivation", true);
    atom.config.set("editor.fontSize", "16");
    let workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
  });
  describe("Undo a completion", () => {
    beforeEach(async () => {
      jasmine.useRealClock();
      atom.config.set("autocomplete-plus.enableAutoActivation", true);
      editor = await atom.workspace.open("sample.js");
      await atom.packages.activatePackage("language-javascript");
      mainModule = (await atom.packages.activatePackage("autocomplete-plus")).mainModule;
      await (0, import_spec_helper.conditionPromise)(
        () => mainModule.autocompleteManager && mainModule.autocompleteManager.ready
      );
    });
    it("restores the previous state", async () => {
      editor.moveToBottom();
      editor.moveToBeginningOfLine();
      editor.insertText("f");
      await (0, import_spec_helper.waitForAutocomplete)(editor);
      editorView = atom.views.getView(editor);
      atom.commands.dispatch(editorView, "autocomplete-plus:confirm");
      expect(editor.getBuffer().getLastLine()).toEqual("function");
      editor.undo();
      expect(editor.getBuffer().getLastLine()).toEqual("f");
    });
  });
});
