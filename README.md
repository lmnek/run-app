
# Unnamed running application

Mobile application for runners inspired by the Nike Run Club app but with a twist: _the coaching audio playing during the run is generated live_! There is **LLM** model hooked up to the users data and current running data, from which it can adapt its monologues. The generated text is then converted to audio using neural **TTS** models. It is also possible to set a theme for each run that will spice things up a bit.

## Technology stack

- **Application**: (both iOS and Android): React Native with Expo
- **Server**: Node.js with tRPC

More detailed instructions on how to run the project are in the corresponding directories.
