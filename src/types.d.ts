declare module "firebaseui" {

  import 'firebase';

  interface IConfig {
    callbacks?: ICallbacks;
    credentialHelper?: auth.CredentialHelper;
    queryParameterForSignInSuccessUrl?: string;
    queryParameterForWidgetMode?: string;
    signInFlow?: 'redirect' | 'popup';
    signInOptions: Array<ISignInOption | string>;
    signInSuccessUrl?: string;
    tosUrl: string;
  }
  interface ICallbacks {
    signInSuccess?: (currentUser: firebase.User, credential?: firebase.auth.AuthCredential, redirectUrl?: string) => boolean;
    uiShown?: () => void;
  }
  interface ISignInOption {
    provider: string;
    scopes?: Array<string>;
    requireDisplayName?: boolean;
  }

  namespace auth {
    enum CredentialHelper { ACCOUNT_CHOOSER_COM, NONE }
    class AuthUI {
      constructor(auth: firebase.auth.Auth);
      start(containerCSSselector: string, config: IConfig): void;
      reset(): void;
    }
  }
}

// https://github.com/tomchentw/react-google-maps/issues/363
declare module 'react-google-maps';
declare module 'react-google-maps/lib/addons/MarkerClusterer';

interface TreeData {
  site: any;
  time: any;
  data: any;
  siteAndTime: any;
}

interface AllData {
  site: any;
  latitude: any;
  longitude: any;
  time: any;
  height: any;
  species: any;
  dbhs: any;
  allDbhs: any;
  siteAndTime: any;
  treeId: any;
}

interface BoxData {
  boxValues: any;
  siteAndTime: any;
  outliers: any;
}