import { registerFirebaseEmulatorSeed } from './firebaseEmulator.js'

export default (on, config) => {
  registerFirebaseEmulatorSeed(on, config)

  return config
}
