// function App() {
//   return (
//     <div>
//       <h1>My React Practice Arena</h1>
//       <p>Start writing your components here!</p>
//     </div>
//   );
// }

// // export default App;


// import React from "react";

// function App() {
//   const message = "Hello, JSX works!";
//   return <h1>{message}</h1>;
// }

// export default App;

// import React from "react";

// function App() {
//   const message = "Hello, JSX works!";
//   return <h1>{message}</h1>;
// }

// export default App;

// import React from "react";
// import MyComponent from "./components/MyComponents.jsx";

// const App = () => {
//   return (
//     <div>
//       <MyComponent />
//     </div>
//   );
// };

// export default App;


// import DefaultComponent, { MyComponent, AnotherComponent } from "./components/MyComponents";

// const App = () => {
//   return (
//     <div>
//       <MyComponent />
//       <AnotherComponent />
//       <DefaultComponent />
//     </div>
//   );
// };

// export default App;

// import React from "react";
// import { Header, Footer } from "./components/MyComponents";
// import MainContent from "./components/MyComponents";

// const App = () => {
//   return (
//     <div>
//       <Header />
//       <MainContent />
//       <Footer />
//     </div>
//   );
// };

// export default App;


// import React, { useState } from 'react';

// function App() {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);

//     return (
//         <div>
//             {isAuthenticated ? (
//                 <h1>User Profile</h1>
//             ) : (
//                 <button onClick={() => 
//                     setIsAuthenticated(true)}>Log In</button>
//             )}
//         </div>
//     );
// }

// export default App;


// import React, { useState, useEffect } from 'react';

// function App() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     setTimeout(() => {
//       setData('Fetched Data');
//       setIsLoading(false);
//     }, 2000);
//   }, []);

//   return (
//     <div>
//       {isLoading ? (
//         <h1>Loading...</h1>
//       ) : (
//         <h1>{data}</h1>
//       )}
//     </div>
//   );
// }

// export default App;


// import React, { useState, useEffect } from 'react';
// function App() {
//   const items = ['Apple', 'Banana', 'Cherry'];

//   return (
//     <div>
//       <h1>My Fruit List</h1>
//       <ul>
//         {items.map((item, index) => (
//           <li key={index}>{item}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default App;

// const users = [
//   { id: 1, name: 'Geeks', age: 30 },
//   { id: 2, name: 'for', age: 25 },
//   { id: 3, name: 'Geeks', age: 20 },
// ];
// const App = () => {
//   return (
//     <ul>
//       {users.map((user) => (
//         <li key={user.id}>
//           {user.name} is {user.age} years old.
//         </li>
//       ))}
//     </ul>
//   );
// }

// export default App;

// const App = () => {
//   const users = [
//     { id: 1, name: 'geeks', age: 30 },
//     { id: 2, name: 'for', age: 25 },
//     { id: 3, name: 'geeks', age: 35 },
//   ];
//   return (
//     <ul>
//       {users.map((user) => (
//         user.age > 30 ? (
//           <li key={user.id}>{user.name} is over 30 years old</li>
//         ) : (
//           <li key={user.id}>{user.name} is under 30 years old</li>
//         )
//       ))}
//     </ul>
//   );
// };

// export default App;

// const App = () => {
//   const COMPANY = ["GEEKS", "FOR", "GEEKS"];
//   const handleClick = (COMPANY) => {
//     alert(`You clicked on ${COMPANY}`);
//   };

//   return (
//     <ul>
//       {COMPANY.map((COMPANY, index) => (
//         <button key={index} onClick={() => handleClick(COMPANY)}>
//           {COMPANY}
//         </button>
//       ))}
//     </ul>
//   );
// };
// export default App;


// import React, { useState } from "react";

// function App() {
//   const [count, setCount] = useState(0);
//   const increment = () => setCount(count + 1);
//   const decrement = () => setCount(count - 1);

//   return (
//     <div>
//       <h1>Count: {count}</h1> {/* Display the current count */}
//       <button onClick={increment}>Increment</button> {/* Increment the count */}
//       <button onClick={decrement}>Decrement</button> {/* Decrement the count */}
//     </div>
//   );
// }

// export default App;


// import React, { useReducer } from "react";

// function reducer(count, action) {
//   if (action === "increment") {
//     return count + 1;
//   }
//   if (action === "decrement") {
//     return count - 1;
//   }
//   return count;
// }

// function App() {
//   const [count, dispatch] = useReducer(reducer, 0);

//   const increment = () => dispatch("increment");
//   const decrement = () => dispatch("decrement");

//   return (
//     <div>
//       <h1>Count: {count}</h1> {/* Display the current count */}
//       <button onClick={increment}>Increment</button> {/* Increment the count */}
//       <button onClick={decrement}>Decrement</button> {/* Decrement the count */}
//     </div>
//   );
// }

// export default App;


// import React, { createContext, useContext, useState } from "react";
// const ThemeContext = createContext();

// function App() {
//   const [theme, setTheme] = useState("light");
//   const toggleTheme = () => {
//     setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
//   };
//   return (
//     <ThemeContext.Provider value={theme}>
//       <div>
//         <h1>Current Theme: {theme}</h1>
//         <button onClick={toggleTheme}>Toggle Theme</button>
//         <ThemeDisplay />
//       </div>
//     </ThemeContext.Provider>
//   );
// }

// function ThemeDisplay() {
//   const theme = useContext(ThemeContext);
//   return <h2>Theme from Context: {theme}</h2>;
// }

// export default App;


// import React, { useState, useEffect } from "react";

// function App() {
//   const [count, setCount] = useState(0);

//   useEffect(() => {
//     document.title = `Count: ${count}`;
//     console.log(`Effect ran. Count is: ${count}`);

//     return () => {
//       console.log("Cleanup for previous effect");
//       document.title = "React App";
//     };
//   }, [count]);

//   return (
//     <div>
//       <h1>Count: {count}</h1>
//       <button onClick={() => setCount(count + 1)}>Increment Count</button>
//     </div>
//   );
// }

// export default App;


// import React, { useState, useMemo } from "react";

// function App() {
//   const [count, setCount] = useState(0);
//   const [text, setText] = useState("");

//   const expensiveCalculation = useMemo(() => {
//     console.log("Expensive calculation...");
//     return count * 2;
//   }, [count]);

//   return (
//     <div>
//       <h1>Count: {count}</h1>
//       <h2>Expensive Calculation: {expensiveCalculation}</h2>
//       <button onClick={() => setCount(count + 1)}>Increment Count</button>

//       <input
//         type="text"
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         placeholder="Type something"
//       />
//     </div>
//   );
// }

// export default App;


// import React, { useState, useRef } from "react";

// function App() {
//   const countRef = useRef(0);
//   const [forceRender, setForceRender] = useState(false);

//   const increment = () => {
//     countRef.current += 1;
//     setForceRender(!forceRender);
//   };

//   return (
//     <div>
//       <h1>Count: {countRef.current}</h1> {/* Display count value */}
//       <button onClick={increment}>Increment</button>
//     </div>
//   );
// }

// export default App;


// import React from "react";
// import useWidth from "./hooks/useWidth.jsx";

// function App() {
//   const width = useWidth();
//   return <h1>Window Width: {width}px</h1>;
// }

// export default App;

// // App.js
// import React from 'react';
// import WelcomePage from './WelcomePage';
// import UserProvider from './Context';

// const App = () => {
//   return (
//     <UserProvider>
//       <WelcomePage />
//     </UserProvider>
//   );
// };

// export default App;



// import React from "react";
// import Counter from "./components/Counter.jsx";

// function App() {
//   return (
//     <div className="App">
//       <h1>React-Redux Counter App</h1>
//       <Counter />
//     </div>
//   );
// }

// export default App;



// import "./App.css";
// import { useState } from "react";

// function App() {
//   const [inp, setINP] = useState("");
//   const [name, setName] = useState("");

//   const clk = () => {
//     setName(inp);
//     setINP("");
//   };

//   return (
//     <div className="App">
//       <h1>GeeksforGeeks</h1>
//       {name ? <h2>Your Name: {name}</h2> : null}
//       <input
//         type="text"
//         placeholder="Enter your name..."
//         onChange={(e) => setINP(e.target.value)}
//         value={inp}
//       />
//       <button onClick={clk}>Save</button>
//     </div>
//   );
// }

// export default App;



// import React, { Component } from 'react';
// import Child from './Child.jsx';
// import './App.css';

// class Parent extends Component {
//   render() {
//     return (
//       <div className="parent-container">
//         <h1>Parent Component</h1>
//         <Child greeting="Hello from Parent!" />
//       </div>
//     );
//   }
// }

// export default Parent;


// import React, { Component } from 'react';
// import Child from './Child';

// class Parent extends Component {

//   handleClick = () => {
//     alert("Button clicked in Child component!");
//   };

//   render() {
//     const containerStyle = {
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "flex-start",
//       height: "100vh",
//       margin: "0",
//     };

//     return (
//       <div style={containerStyle}>
//         <div>
//           <h1>Parent Component</h1>
//           {/* Passing the event handler as a prop to the Child component */}
//           <Child onClickHandler={this.handleClick} />
//         </div>
//       </div>
//     );
//   }
// }

// export default Parent;


// import React from "react";

// function Button({ onClickHandler }) {
//   return <button onClick={onClickHandler}>Click Me</button>;
// }

// function Parent() {
//   const handleClick = () => {
//     alert("Button clicked!");
//   };

//   return <Button onClickHandler={handleClick} />;
// }

// export default Parent;



// import React from "react";

// function Child() {
//   const handleClick = (event) => {
//     event.stopPropagation();
//     alert("Child button clicked");
//   };

//   return <button onClick={handleClick}>Child Button</button>;
// }

// function Parent() {
//   const handleClick = () => {
//     alert("Parent div clicked");
//   };

//   return (
//     <div
//       onClick={handleClick}
//       style={{ padding: "50px", backgroundColor: "lightgray" }}
//     >
//       <Child />
//     </div>
//   );
// }

// export default Parent;



// import React from "react";

// function App() {
//   const onClickCaptureHandler = () => {
//     console.log("onClickCapture!");
//   };
//   return (
//     <div className="App">
//       <h1> Hey Geek!</h1>
//       <label>Please click on the button</label>
//       <button onClickCapture={onClickCaptureHandler}>
//         click Me!
//       </button>
//     </div>
//   );
// }

// export default App;



// import React from "react";

// class PreventDefaultComponent extends React.Component {
//   handleClickCapture = (event) => {
//     event.preventDefault();
//     event.stopPropagation();
//     console.log("Default behavior prevented during the capture phase");
//   };

//   handleClick = () => {
//     console.log("Event triggered during the bubble phase");
//   };

//   render() {
//     return (
//       <div onClickCapture={this.handleClickCapture} style={{ padding: "20px" }}>
//         <form onSubmit={(e) => e.preventDefault()}>
//           <button
//             type="submit"
//             onClick={this.handleClick}
//             style={{ padding: "10px", backgroundColor: "lightblue" }}
//           >
//             Submit
//           </button>
//         </form>
//       </div>
//     );
//   }
// }

// export default PreventDefaultComponent;


// import React, { useState } from "react";
// import "./App.css";
// const App = () => {
//   const [count, setCount] = useState(0);

//   const handleMouseDown = () => {
//     setCount(count + 1);
//   };

//   return (
//     <div className="App">
//       <h2>Count: {count}</h2>
//       <button onMouseDown={handleMouseDown}>Increment on Mouse Down</button>
//     </div>
//   );
// };

// export default App;



// import React, { useState } from "react";
// import "./App.css";

// function App() {
//   const onDoubleClickHandler = () => {
//     console.log("You have Clicked Twice");
//   };
//   return (
//     <div className="App">
//       <h1> Hey Geek!</h1>
//       <button onDoubleClick={onDoubleClickHandler}>
//         Double Click Me!
//       </button>
//     </div>
//   );
// }

// export default App;



// // Filename - App.js

// import React, { useState } from "react";
// function App() {
//   const [value, setValue] = useState("");
//   const [result, setResult] = useState("");
//   function handleSubmit(e) {
//     e.preventDefault();
//     setResult(
//       "Form has been submitted with with Input: " +
//       value
//     );
//   }

//   function handleChange(e) {
//     setValue(e.target.value);
//     setResult("");
//   }
//   return (
//     <div
//       style={{ textAlign: "center", margin: "auto" }}
//     >
//       <h1 style={{ color: "Green" }}>
//         GeeksforGeeks
//       </h1>
//       <h3>
//         Exemple for React onSubmit Event Handler
//       </h3>
//       <form onSubmit={handleSubmit}>
//         <label>Add input here: </label>
//         <input
//           value={value}
//           onInput={handleChange}
//           required
//         />
//         <br />
//         <br />
//         <button type="submit">Submit</button>
//       </form>
//       <br />
//       <div>
//         <h4>{result}</h4>
//       </div>
//     </div>
//   );
// }

// export default App;

// import React, { useState } from "react";

// function AccessEvent() {
//   const [value, setValue] = useState("");
//   const handleSubmit = (event) => {
//     console.log("Event object:", event);
//     alert(`Form submitted with value: ${value}`);
//   };

//   const handleChange = (event) => {
//     setValue(event.target.value);
//   };

//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <label>
//           Enter Text:
//           <input type="text" value={value} onChange={handleChange} />
//         </label>
//         <button type="submit">Submit</button>
//       </form>
//     </div>
//   );
// }

// export default AccessEvent;



// import React, { useState } from "react";

// function App() {
//   // State to store the scroll position
//   const [scrollPosition, setScrollPosition] = useState(0);

//   // Event handler for the scroll event
//   const handleScroll = (event) => {
//     // The target of the event is the div that is being scrolled
//     const scrollTop = event.target.scrollTop;
//     setScrollPosition(scrollTop); // Update the scroll position in state
//   };

//   return (
//     <div>
//       {/* Fixed position to display scroll position */}
//       <h1 style={{ position: "fixed", top: "20px", left: "20px", color: "red" }}>
//         Scroll Position: {scrollPosition}px
//       </h1>

//       {/* Scrollable div */}
//       <div
//         className="scrollable-element"
//         style={{
//           height: "300px",
//           width: "100%",
//           overflowY: "scroll",
//           border: "1px solid #ccc",
//           paddingTop: "40px", // Space to avoid overlap with the fixed h1
//         }}
//         onScroll={handleScroll}
//       >
//         {/* Content with enough height to enable scrolling */}
//         <p>
//           Scroll down to see the position update. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
//           Curabitur sit amet velit ut purus condimentum tincidunt. Suspendisse sit amet purus quam.
//           Nulla facilisi. Sed vel felis leo. Pellentesque ut dui quam.
//         </p>
//         <p>
//           Nulla convallis lectus eget turpis tempor, sed elementum lacus aliquet. Sed maximus ligula at dolor
//           vehicula, ac consequat nunc pellentesque. Cras auctor volutpat interdum. Sed vel felis leo.
//           Pellentesque ut dui quam. Suspendisse sit amet purus quam.
//         </p>
//         <p>
//           Curabitur in velit sit amet velit ullamcorper iaculis non id urna. Aenean nec ante erat.
//           Maecenas sollicitudin neque in quam elementum placerat. Phasellus feugiat dolor ac odio mollis,
//           euismod feugiat nisi ullamcorper. Mauris sed velit mi.
//         </p>
//         <p>
//           Donec vitae libero vitae felis pharetra fermentum. Integer malesuada venenatis est in laoreet.
//           Vestibulum feugiat laoreet nunc at scelerisque. Etiam convallis felis nec justo iaculis, et elementum
//           enim sodales. Sed convallis volutpat orci in volutpat. Suspendisse facilisis sollicitudin.
//         </p>
//         <p>
//           Integer malesuada venenatis est in laoreet. Vestibulum feugiat laoreet nunc at scelerisque.
//           Etiam convallis felis nec justo iaculis, et elementum enim sodales. Sed convallis volutpat orci in volutpat.
//         </p>
//       </div>
//     </div>
//   );
// }

// export default App;



// import React, { useState } from "react";
// function App() {
//   const [backgroundColor, setBackgroundColor] = useState("white");

//   const handleScroll = (event) => {
//     const { scrollTop, scrollHeight, clientHeight } = event.target;
//     const scrollRatio = scrollTop / (scrollHeight - clientHeight);

//     if (scrollRatio > 0.5) {
//       setBackgroundColor("lightblue");
//     } else {
//       setBackgroundColor("white");
//     }
//   };

//   return (
//     <div
//       className="scrollable-section"
//       style={{
//         height: "300px",
//         overflowY: "scroll",
//         border: "1px solid #ccc",
//         backgroundColor: backgroundColor,
//         transition: "background-color 0.5s ease",
//       }}
//       onScroll={handleScroll}
//     >
//       <p style={{ paddingTop: "200px", textAlign: "center" }}>
//         Scrollable Section
//       </p>
//       <p style={{ paddingTop: "500px", textAlign: "center" }}>
//         Keep scrolling...
//       </p>
//       <p style={{ paddingTop: "800px", textAlign: "center" }}>
//         Background Changes on Scroll
//       </p>
//     </div>
//   );
// }

// export default App;



// src/App.js

// import React from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Link,
//   useNavigate,
//   Outlet,
// } from "react-router-dom";


// // Home Page Component
// const Home = () => {
//   const navigate = useNavigate();

//   return (
//     <div>
//       <h2>Home Page</h2>
//       <button onClick={() =>
//         navigate("/contact")}>Go to Contact</button>
//     </div>
//   );
// };

// // About Page Component 
// const About = () => (
//   <div>
//     <h2>About Page</h2>
//     <nav>
//       <ul>
//         <li>
//           <Link to="team">Our Team</Link>
//         </li>
//         <li>
//           <Link to="company">Our Company</Link>
//         </li>
//       </ul>
//     </nav>
//     <Outlet />
//   </div>
// );

// // Components for other pages
// const Contact = () => <h2>Contact Page</h2>;
// const Team = () => <h2>Team Page</h2>;
// const Company = () => <h2>Company Page</h2>;

// function App() {
//   return (
//     <Router>
//       <nav>
//         <ul>
//           <li>
//             <Link to="/">Home</Link>
//           </li>
//           <li>
//             <Link to="/about">About</Link>
//           </li>
//           <li>
//             <Link to="/contact">Contact</Link>
//           </li>
//         </ul>
//       </nav>
//       {/*Implementing Routes for respective Path */}
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/about" element={<About />}>
//           <Route path="team" element={<Team />} />
//           <Route path="company" element={<Company />} />
//         </Route>
//         <Route path="/contact" element={<Contact />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;


// import React from "react";
// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import Home from "./components/Home";
// import About from "./components/About";
// import Contact from "./components/Contact";

// const App = () => {
//   return (
//     <BrowserRouter>
//       <div style={{ fontFamily: "Arial, sans-serif" }}>
//         {/* Navigation Bar */}
//         <nav
//           style={{
//             backgroundColor: "#333",
//             padding: "10px",
//             display: "flex",
//             justifyContent: "center",
//           }}
//         >
//           <ul
//             style={{
//               listStyle: "none",
//               display: "flex",
//               gap: "20px",
//               padding: "0",
//               margin: "0",
//             }}
//           >
//             <li>
//               <Link to="/" style={linkStyle}>
//                 Home
//               </Link>
//             </li>
//             <li>
//               <Link to="/about" style={linkStyle}>
//                 About Us
//               </Link>
//             </li>
//             <li>
//               <Link to="/contact" style={linkStyle}>
//                 Contact Us
//               </Link>
//             </li>
//           </ul>
//         </nav>

//         {/* Page Content */}
//         <div
//           style={{ display: "flex", justifyContent: "center", padding: "20px" }}
//         >
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/about" element={<About />} />
//             <Route path="/contact" element={<Contact />} />
//           </Routes>
//         </div>
//       </div>
//     </BrowserRouter>
//   );
// };

// // Style for navigation links
// const linkStyle = {
//   textDecoration: "none",
//   color: "white",
//   fontSize: "18px",
//   fontWeight: "bold",
// };

// export default App;



// Filename - App.js

// import { Routes, Route, Link } from "react-router-dom";
// import Home from "./components/Home";
// import ContactUs from "./components/ContactUs";
// import LogIn from "./components/LogIn";
// import AboutUs from "./components/AboutUs";
// import Profile from "./components/Profile";

// export default function App() {
//   return (
//     <div className="App" style={{ fontFamily: "sans-serif" }}>
//       {/* Navigation Bar */}
//       <nav
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           gap: "20px",
//           padding: "15px",
//           backgroundColor: "#2c3e50",
//           marginBottom: "30px",
//         }}
//       >
//         <Link to="/" style={navLinkStyle}>Home</Link>
//         <Link to="/about" style={navLinkStyle}>About Us</Link>
//         <Link to="/contact-us" style={navLinkStyle}>Contact Us</Link>
//         <Link to="/log-in" style={navLinkStyle}>Log In</Link>
//       </nav>

//       {/* Routed Content */}
//       <div style={{ display: "flex", justifyContent: "center", padding: "0 20px" }}>
//         <Routes>
//           <Route path="/" element={<Home someProps={{ id: 54545454 }} />} />
//           <Route path="/about" element={<AboutUs />} />
//           <Route path="/contact-us" element={<ContactUs />} />
//           <Route path="/log-in" element={<LogIn />} />
//           <Route path="/profile/:userName" element={<Profile />} />
//         </Routes>
//       </div>
//     </div>
//   );
// }

// const navLinkStyle = {
//   color: "white",
//   textDecoration: "none",
//   fontWeight: "bold",
//   fontSize: "16px",
// };


// import React, { useState, useEffect } from "react";

// function App() {
//   const [users, setUsers] = useState([]);

//   useEffect(() => {
//     fetch("https://jsonplaceholder.typicode.com/users")
//       .then(response => response.json())
//       .then(data => setUsers(data))
//       .catch(error => console.log(error));
//   }, []);

//   return (
//     <div>
//       <h2>User List</h2>

//       {users.map(user => (
//         <p key={user.id}>{user.name}</p>
//       ))}
//     </div>
//   );
// }

// export default App;


// //app.js

// import React, { useState, useEffect } from 'react';

// const ErrorHandling = () => {
//   const [data, setData] = useState([]);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const response = await fetch(
//         'https://jsonplaceholder.typicode.com/posts'
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const result = await response.json();
//       setData(result);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div>Loading...</div>;

//   if (error) return <div>Error: {error}</div>;

//   if (data.length === 0) return <div>No data available</div>;

//   return (
//     <div>
//       <h1>Fetched Data</h1>
//       <ul>
//         {data.map(item => (
//           <li key={item.id}>{item.title}</li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default ErrorHandling;



// //App.js

// import React from "react";
// import ErrorBoundary from "./Components/ErrorBoundary";
// import BuggyComponent from "./Components/BuggyComponent";

// const App = () => {
//   return (
//     <div style={{ textAlign: "center", marginTop: "30px" }}>
//       <h1>React Error Boundaries Example</h1>
//       <ErrorBoundary>
//         <BuggyComponent />
//       </ErrorBoundary>
//     </div>
//   );
// };

// export default App;



// //App.js
// import React from "react";
// import ErrorHandlingComponent from "./components/ErrorHandlingComponent";

// const App = () => {
//   return (
//     <div style={{ textAlign: "center", marginTop: "30px" }}>
//       <h1>React Error Handling Example</h1>
//       <ErrorHandlingComponent />
//     </div>
//   );
// };

// export default App;


//App.js
import React from "react";
import ApiComponent from "./components/ApiComponent";

const App = () => {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>React API Error Handling Example</h1>
      <ApiComponent />
    </div>
  );
};

export default App;