import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaCheck, FaHeadphones, FaTrash, FaEdit, FaSignOutAlt, FaFileWord, FaFileAlt, FaCalendar, FaPlay, FaReadme, FaArrowLeft, FaCheckDouble, FaClock } from 'react-icons/fa';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, collection, query, where, orderBy, and, onSnapshot, addDoc, updateDoc, limit, persistentLocalCache, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider } from 'firebase/auth';

import { Readability } from '@mozilla/readability';
import { saveAs } from 'file-saver';
import * as docx from 'docx';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

const speechKey = process.env.REACT_APP_AZURE_SPEECH_API_KEY;
const serviceRegion = 'eastus';
const voiceName = 'en-US-AvaNeural';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
var articles = '';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [readerMode, setReaderMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const todoCollection = collection(db, 'todo');
      const urlParams = new URLSearchParams(window.location.search);
      const limitParam = urlParams.get('limit');
      const limitValue = limitParam ? parseInt(limitParam) : 6;
      //print limit value
      console.log('limit value: ', limitValue);
      const q = query(todoCollection, where('userId', '==', user.uid), where('status', '==', false), orderBy('createdDate', 'desc'), limit(limitValue));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        articles += tasksData.map((task) => task.task).join(' ');
        setTasks(tasksData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const todoCollection = collection(db, 'todo');
      const urlParams = new URLSearchParams(window.location.search);
      const limitParam = urlParams.get('limit');
      const limitValue = limitParam ? parseInt(limitParam) : 6;
      //print limit value
      console.log('limit value: ', limitValue);
      const q = query(todoCollection, where('userId', '==', user.uid), where('status', '==', true), orderBy('createdDate', 'desc'), limit(limitValue));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const completedTasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCompletedTasks(completedTasksData);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (showCompleted) {
      handleShowCompleted();
    }
  }, [showCompleted]);

  const handleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const handleSignOut = () => {
    auth.signOut();
  };


  const splitMessage = (msg, chunkSize = 4000) => {
    const chunks = [];
    for (let i = 0; i < msg.length; i += chunkSize) {
      chunks.push(msg.substring(i, i + chunkSize));
    }
    return chunks;
  };

  const synthesizeSpeech = async () => {
    const speechConfig = speechsdk.SpeechConfig.fromSubscription(speechKey, serviceRegion);
    speechConfig.speechSynthesisVoiceName = voiceName;

    const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
    const speechSynthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);

    const chunks = splitMessage(articles);
    for (const chunk of chunks) {
      try {
        const result = await speechSynthesizer.speakTextAsync(chunk);
        if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
          console.log(`Speech synthesized to speaker for text: [${chunk}]`);
        } else if (result.reason === speechsdk.ResultReason.Canceled) {
          const cancellationDetails = speechsdk.SpeechSynthesisCancellationDetails.fromResult(result);
          console.error(`Speech synthesis canceled: ${cancellationDetails.reason}`);
          if (cancellationDetails.reason === speechsdk.CancellationReason.Error) {
            console.error(`Error details: ${cancellationDetails.errorDetails}`);
          }
        }
      } catch (error) {
        console.error(`Error synthesizing speech: ${error}`);
      }
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTask.trim() !== '') {
      let textresponse = '';
      if (newTask.substring(0, 4) == 'http') {
        const urlWithoutProtocol = newTask.replace(/^https?:\/\//, '');
        const response = await fetch('https://us-central1-reviewtext-ad5c6.cloudfunctions.net/function-9?url=' + newTask);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Initialize Readability with the document
        const reader = new Readability(doc);
        const article = reader.parse();
        try {
          textresponse = article.title + ' . ' + article.textContent;
        }
        catch (error) {
          textresponse = error + '   Could not parse url : ' + newTask;
        }
      }
      else {
        textresponse = newTask;
      }

      await addDoc(collection(db, 'todo'), {
        task: textresponse,
        status: false,
        userId: user.uid,
        createdDate: new Date(),
        uemail: user.email
      });
      setNewTask('');
    }
  };

  const handleUpdateTask = async (taskId, newTaskText) => {
    if (newTaskText.trim() !== '') {
      const taskDocRef = doc(db, 'todo', taskId);
      await updateDoc(taskDocRef, {
        task: newTaskText,
      });
    }
  };


  const handleToggleStatus = async (taskId, status) => {
    const taskDocRef = doc(db, 'todo', taskId);
    await updateDoc(taskDocRef, {
      status: !status,
    });
  };

  const generateDocx = async () => {
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          new docx.Paragraph({
            children: [
              new docx.TextRun(articles),
            ],
          }),
        ],
      }]
    });

    docx.Packer.toBlob(doc).then(blob => {
      console.log(blob);
      const now = new Date();
      const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const time = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
      const dateTime = `${date}__${time}`;
      saveAs(blob, dateTime + "_" + ".docx");
      console.log("Document created successfully");
    });
  };


  const generateText = async () => {
    const blob = new Blob([articles], { type: "text/plain;charset=utf-8" });
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const time = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
    const dateTime = `${date}__${time}`;
    saveAs(blob, dateTime + ".txt");
  }

  const handleShowCompleted = () => {
    const todoCollection = collection(db, 'todo');
    const urlParams = new URLSearchParams(window.location.search);
    const limitParam = urlParams.get('limit');
    const limitValue = limitParam ? parseInt(limitParam) : 6;
    const q = query(todoCollection, where('userId', '==', user.uid), where('status', '==', true), orderBy('createdDate', 'desc'), limit(limitValue));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const completedTasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompletedTasks(completedTasksData);
    });

    return () => unsubscribe();
  };
  const handleReaderMode = () => {
    setReaderMode(true);
  };

  const handleBack = () => {
    setReaderMode(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent, please check your inbox.');
    } catch (error) {
      console.error('Error sending password reset email', error);
    }
  };


  const handleSignInWithEmail = async (e) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        await auth.signOut();
        alert('Please verify your email before signing in.');
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        alert('Wrong password, please try again.');
      } else {
        alert('Error signing in, please try again.' + error.message);
        console.error('Error signing in:', error);
      }
    }
  };

  const handleSignUpWithEmail = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(auth.currentUser);
      const user = userCredential.user;
      alert('Verification email sent! Please check your inbox. Ater verification, please sign in.');
      if (!user.emailVerified) {
        await auth.signOut();
      }
    } catch (error) {
      alert('Error signing up, please try again.' + error.message);
      console.error('Error signing up:', error);
    }
  };


  return (
    <div>
          {user && <div className="app" style={{ marginBottom: '120px', fontSize: '24px' }}>
      {readerMode ? (
          <div>
            <button className="button" onClick={handleBack}><FaArrowLeft /></button>
            <p>{articles}</p>
          </div>
        ) : (
        <div>
          <button className="signoutbutton" onClick={handleSignOut}>
            <FaSignOutAlt />
          </button>
          <button className='button' onClick={generateDocx}><FaFileWord /></button>
          <button className='button' onClick={generateText}><FaFileAlt /></button>
          <button className='button' onClick={synthesizeSpeech}><FaHeadphones /></button>
          <button className='button' onClick={handleReaderMode}><FaReadme /></button>
          <form onSubmit={handleAddTask}>
            <input
              className="addTask"
              type="text"
              placeholder=""
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Shift') { handleAddTask(e); } }}
              autoFocus
            />
            <button className="addbutton" type="submit">
              <FaPlus />
            </button>
          </form>
          <ul>
            {tasks
              .filter((task) => !task.status)
              .map((task) => (
                <li key={task.id}>
                  {editTask === task.id ? (
                    <form onSubmit={handleUpdateTask}>
                      <input
                        type="text"
                        value={editTaskText}
                        onChange={(e) => setEditTaskText(e.target.value)}
                      />
                      <button type="submit">
                        <FaCheck />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button className='markcompletebutton' onClick={() => handleToggleStatus(task.id, task.status)}>
                        <FaCheck />
                      </button>
                      <span>{task.task}</span>

                    </>
                  )}
                </li>
              ))}
          </ul>
          <button className='showcompletedbutton' onClick={() => setShowCompleted(!showCompleted)}>
            <FaEye /> {showCompleted ? 'Hide' : 'Show'} Completed Tasks
          </button>
          {showCompleted && (
            <div>
              <h2>Completed Tasks</h2>
              <ul>
                {completedTasks
                  .filter((task) => task.status)
                  .map((task) => (
                    <li key={task.id} className="completed">
                      <button onClick={() => handleToggleStatus(task.id, task.status)}>
                        <FaCheck />
                      </button>
                      {task.task}
                    </li>
                  ))}
              </ul>
              <div style={{ marginBottom: '110px' }}></div>
            </div>
          )}
        </div>
      ) }
    </div>}
    {!user && <div style={{ fontSize: '22px', width: '100%', margin: '0 auto' }}>
        <br />
        <br />
        <p>Sign In</p>
        <input
          className='textinput'
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <br />
        <input
          type="password"
          className='textinput'
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <br />
        <button className='signonpagebutton' onClick={() => handleSignInWithEmail()}>Sign In</button>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <button className='signuppagebutton' onClick={() => handleSignUpWithEmail()}>Sign Up</button>
        <br />
        <br />
        <button onClick={() => handlePasswordReset()}>Forgot Password?</button>
        <br />
        <br />
        <br />
        <br />
        <p> OR </p>
        <br />
        <button className='signgooglepagebutton' onClick={handleSignIn}>Sign In with Google</button>
        <br />
      </div>}
    </div>
  )
}


export default App;