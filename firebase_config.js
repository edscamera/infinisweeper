const firebaseConfig = {
    apiKey: "AIzaSyD1vGYCL-rOxFggOBTKjzPlu7I2nB5MBJ4",
    authDomain: "edwardscamera-infinisweeper.firebaseapp.com",
    databaseURL: "https://edwardscamera-infinisweeper-default-rtdb.firebaseio.com",
    projectId: "edwardscamera-infinisweeper",
    storageBucket: "edwardscamera-infinisweeper.appspot.com",
    messagingSenderId: "972437577186",
    appId: "1:972437577186:web:6b247dbbaba7dc9f9a2dbb",
    measurementId: "G-2769KMR17N",
};
firebase.initializeApp(firebaseConfig);
window.db = firebase.database();