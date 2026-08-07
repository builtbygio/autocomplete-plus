var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_path = __toESM(require("path"));
var import_fs_plus = __toESM(require("fs-plus"));
var import_spec_helper = require("./spec-helper");
let temp = require("temp").track();
describe("Autocomplete Manager", () => {
  let directory;
  let filePath;
  let editorView;
  let editor;
  let mainModule;
  let autocompleteManager;
  let createSuggestionsPromise;
  beforeEach(async () => {
    jasmine.useRealClock();
    directory = temp.mkdirSync();
    let sample = `var quicksort = function () {
var sort = function(items) {
  if (items.length <= 1) return items;
  var pivot = items.shift(), current, left = [], right = [];
  while(items.length > 0) {
    current = items.shift();
    current < pivot ? left.push(current) : right.push(current);
  }
  return sort(left).concat(pivot).concat(sort(right));
};

return sort(Array.apply(this, arguments));
};
`;
    filePath = import_path.default.join(directory, "sample.js");
    import_fs_plus.default.writeFileSync(filePath, sample);
    atom.config.set("autosave.enabled", true);
    atom.config.set("autocomplete-plus.enableAutoActivation", true);
    atom.config.set("editor.fontSize", "16");
    let workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    await atom.packages.activatePackage("autosave");
    editor = await atom.workspace.open(filePath);
    editorView = atom.views.getView(editor);
    await atom.packages.activatePackage("language-javascript");
    mainModule = (await atom.packages.activatePackage("autocomplete-plus")).mainModule;
    await (0, import_spec_helper.conditionPromise)(
      () => mainModule && mainModule.autocompleteManager && mainModule.autocompleteManager.ready
    );
    autocompleteManager = mainModule.autocompleteManager;
    let { displaySuggestions } = autocompleteManager;
    const suggestionsPromises = /* @__PURE__ */ new Set();
    createSuggestionsPromise = function() {
      return new Promise((resolve) => {
        suggestionsPromises.add(resolve);
      });
    };
    spyOn(autocompleteManager, "displaySuggestions").andCallFake((suggestions, options) => {
      displaySuggestions(suggestions, options);
      for (const resolve of suggestionsPromises) {
        resolve();
      }
      suggestionsPromises.clear();
    });
  });
  describe(
    "autosave compatibility",
    () => it("keeps the suggestion list open while saving", async () => {
      expect(editorView.querySelector(".autocomplete-plus")).not.toExist();
      const firstEventPromise = createSuggestionsPromise();
      editor.moveToBottom();
      editor.moveToBeginningOfLine();
      editor.insertText("f");
      await firstEventPromise;
      const secondEventPromise = createSuggestionsPromise();
      editor.save();
      expect(editorView.querySelector(".autocomplete-plus")).toExist();
      editor.insertText("u");
      await secondEventPromise;
      editor.save();
      expect(editorView.querySelector(".autocomplete-plus")).toExist();
      let suggestionListView = autocompleteManager.suggestionList.suggestionListElement;
      atom.commands.dispatch(suggestionListView.element, "autocomplete-plus:confirm");
      expect(editor.getBuffer().getLastLine()).toEqual("function");
    })
  );
});
