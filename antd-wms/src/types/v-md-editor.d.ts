declare module '@kangc/v-md-editor' {
  import { App } from 'vue';
  
  const VMdEditor: {
    use: (theme: any, options?: any) => void;
    install: (app: App) => void;
  };
  
  export default VMdEditor;
}

declare module '@kangc/v-md-editor/lib/preview' {
  import { App } from 'vue';
  
  const VMdPreview: {
    use: (theme: any, options?: any) => void;
    install: (app: App) => void;
  };
  
  export default VMdPreview;
}

declare module '@kangc/v-md-editor/lib/theme/github.js' {
  const githubTheme: any;
  export default githubTheme;
} 