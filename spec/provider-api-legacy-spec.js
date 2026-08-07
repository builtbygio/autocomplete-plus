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
var import_spec_helper = require("./spec-helper");
var import_grim = __toESM(require("grim"));
describe("Provider API Legacy", () => {
  let [editor, mainModule, autocompleteManager, registration, testProvider] = [];
  beforeEach(async () => {
    jasmine.useRealClock();
    jasmine.snapshotDeprecations();
    atom.config.set("autocomplete-plus.enableAutoActivation", true);
    atom.config.set("editor.fontSize", "16");
    atom.config.set("autocomplete-plus.autoActivationDelay", 100);
    let workspaceElement = atom.views.getView(atom.workspace);
    jasmine.attachToDOM(workspaceElement);
    await atom.packages.activatePackage("language-javascript");
    editor = await atom.workspace.open("sample.js");
    mainModule = (await atom.packages.activatePackage("autocomplete-plus")).mainModule;
    await (0, import_spec_helper.conditionPromise)(() => {
      autocompleteManager = mainModule.autocompleteManager;
      return autocompleteManager;
    });
  });
  afterEach(() => {
    if (registration && registration.dispose) {
      registration.dispose();
    }
    registration = null;
    if (testProvider && testProvider.dispose) {
      testProvider.dispose();
    }
    testProvider = null;
    jasmine.restoreDeprecationsSnapshot();
  });
  describe(
    "Provider with API v2.0 registered as 3.0",
    () => it("throws exceptions for renamed provider properties on registration", () => {
      expect(
        () => mainModule.consumeProvider_3_0({
          selector: "*",
          getSuggestions() {
          }
        })
      ).toThrow();
      expect(
        () => mainModule.consumeProvider_3_0({
          disableForSelector: "*",
          getSuggestions() {
          }
        })
      ).toThrow();
    })
  );
  describe("Provider with API v1.0 registered as 2.0", () => {
    it("raises deprecations for provider attributes on registration", () => {
      let numberDeprecations = import_grim.default.getDeprecationsLength();
      class SampleProvider {
        constructor() {
          this.id = "sample-provider";
          this.selector = ".source.js,.source.coffee";
          this.blacklist = ".comment";
        }
        requestHandler(options) {
          return [{ word: "ohai", prefix: "ohai" }];
        }
      }
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "2.0.0", new SampleProvider());
      expect(import_grim.default.getDeprecationsLength() - numberDeprecations).toBe(3);
      let deprecations = import_grim.default.getDeprecations();
      let deprecation = deprecations[deprecations.length - 3];
      expect(deprecation.getMessage()).toContain("`id`");
      expect(deprecation.getMessage()).toContain("SampleProvider");
      deprecation = deprecations[deprecations.length - 2];
      expect(deprecation.getMessage()).toContain("`requestHandler`");
      deprecation = deprecations[deprecations.length - 1];
      expect(deprecation.getMessage()).toContain("`blacklist`");
    });
    it("raises deprecations when old API parameters are used in the 2.0 API", async () => {
      class SampleProvider {
        constructor() {
          this.selector = ".source.js,.source.coffee";
        }
        getSuggestions(options) {
          return [
            {
              word: "ohai",
              prefix: "ohai",
              label: '<span style="color: red">ohai</span>',
              renderLabelAsHtml: true,
              className: "ohai"
            }
          ];
        }
      }
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "2.0.0", new SampleProvider());
      let numberDeprecations = import_grim.default.getDeprecationsLength();
      (0, import_spec_helper.triggerAutocompletion)(editor, true, "o");
      await (0, import_spec_helper.waitForAutocomplete)(editor);
      expect(import_grim.default.getDeprecationsLength() - numberDeprecations).toBe(3);
      let deprecations = import_grim.default.getDeprecations();
      let deprecation = deprecations[deprecations.length - 3];
      expect(deprecation.getMessage()).toContain("`word`");
      expect(deprecation.getMessage()).toContain("SampleProvider");
      deprecation = deprecations[deprecations.length - 2];
      expect(deprecation.getMessage()).toContain("`prefix`");
      deprecation = deprecations[deprecations.length - 1];
      expect(deprecation.getMessage()).toContain("`label`");
    });
    it("raises deprecations when hooks are passed via each suggestion", async () => {
      class SampleProvider {
        constructor() {
          this.selector = ".source.js,.source.coffee";
        }
        getSuggestions(options) {
          return [
            {
              text: "ohai",
              replacementPrefix: "ohai",
              onWillConfirm() {
              },
              onDidConfirm() {
              }
            }
          ];
        }
      }
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "2.0.0", new SampleProvider());
      let numberDeprecations = import_grim.default.getDeprecationsLength();
      (0, import_spec_helper.triggerAutocompletion)(editor, true, "o");
      await (0, import_spec_helper.waitForAutocomplete)(editor);
      expect(import_grim.default.getDeprecationsLength() - numberDeprecations).toBe(2);
      let deprecations = import_grim.default.getDeprecations();
      let deprecation = deprecations[deprecations.length - 2];
      expect(deprecation.getMessage()).toContain("`onWillConfirm`");
      expect(deprecation.getMessage()).toContain("SampleProvider");
      deprecation = deprecations[deprecations.length - 1];
      expect(deprecation.getMessage()).toContain("`onDidConfirm`");
    });
  });
  describe(
    "Provider API v1.1.0",
    () => it("registers the provider specified by {providers: [provider]}", () => {
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(1);
      testProvider = {
        selector: ".source.js,.source.coffee",
        requestHandler(options) {
          return [{ word: "ohai", prefix: "ohai" }];
        }
      };
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "1.1.0", { providers: [testProvider] });
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(2);
    })
  );
  describe("Provider API v1.0.0", () => {
    let [registration1, registration2, registration3] = [];
    afterEach(() => {
      if (registration1) {
        registration1.dispose();
      }
      if (registration2) {
        registration2.dispose();
      }
      if (registration3) {
        registration3.dispose();
      }
    });
    it("passes the correct parameters to requestHandler", async () => {
      testProvider = {
        selector: ".source.js,.source.coffee",
        requestHandler(options) {
          return [{ word: "ohai", prefix: "ohai" }];
        }
      };
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "1.0.0", { provider: testProvider });
      spyOn(testProvider, "requestHandler");
      (0, import_spec_helper.triggerAutocompletion)(editor, true, "o");
      await (0, import_spec_helper.waitForAutocomplete)(editor);
      let args = testProvider.requestHandler.mostRecentCall.args[0];
      expect(args.editor).toBeDefined();
      expect(args.buffer).toBeDefined();
      expect(args.cursor).toBeDefined();
      expect(args.position).toBeDefined();
      expect(args.scope).toBeDefined();
      expect(args.scopeChain).toBeDefined();
      expect(args.prefix).toBeDefined();
    });
    it("should allow registration of a provider", async () => {
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      testProvider = {
        requestHandler(options) {
          return [
            {
              word: "ohai",
              prefix: "ohai",
              label: '<span style="color: red">ohai</span>',
              renderLabelAsHtml: true,
              className: "ohai"
            }
          ];
        },
        selector: ".source.js,.source.coffee"
      };
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "1.0.0", { provider: testProvider });
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(2);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(2);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(testProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(testProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.go")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      (0, import_spec_helper.triggerAutocompletion)(editor, true, "o");
      await (0, import_spec_helper.waitForAutocomplete)(editor);
      let suggestionListView = autocompleteManager.suggestionList.suggestionListElement;
      expect(suggestionListView.element.querySelector("li .right-label")).toHaveHtml('<span style="color: red">ohai</span>');
      expect(suggestionListView.element.querySelector("li")).toHaveClass("ohai");
    });
    it("should dispose a provider registration correctly", () => {
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      testProvider = {
        requestHandler(options) {
          return [{
            word: "ohai",
            prefix: "ohai"
          }];
        },
        selector: ".source.js,.source.coffee"
      };
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "1.0.0", { provider: testProvider });
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(2);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(2);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(testProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(testProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.go")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      registration.dispose();
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      registration.dispose();
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
    });
    it("should remove a providers registration if the provider is disposed", () => {
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      testProvider = {
        requestHandler(options) {
          return [{
            word: "ohai",
            prefix: "ohai"
          }];
        },
        selector: ".source.js,.source.coffee",
        dispose() {
        }
      };
      registration = atom.packages.serviceHub.provide("autocomplete.provider", "1.0.0", { provider: testProvider });
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(2);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(2);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(testProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(testProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.go")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      testProvider.dispose();
      expect(autocompleteManager.providerManager.store).toBeDefined();
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee").length).toEqual(1);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.js")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      expect(autocompleteManager.providerManager.applicableProviders(["workspace-center"], ".source.coffee")[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
    });
  });
});
