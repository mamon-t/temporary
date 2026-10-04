// Ambient declarations so checkJs (jsconfig) resolves the Vibeli virtual module
// the vite-plugin provides. The codegen entity types live in ./.vibeli/types.d.ts
// (generated on dev/build; included via jsconfig).
declare module "virtual:vibeli/bootstrap" {
  const bootstrap: {
    appId: string;
    gatewayUrl: string;
    contractVersion: string;
  };
  export default bootstrap;
}
