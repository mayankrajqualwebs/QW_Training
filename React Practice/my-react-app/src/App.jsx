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

// App.js
import React from 'react';
import WelcomePage from './WelcomePage';
import UserProvider from './Context';

const App = () => {
  return (
    <UserProvider>
      <WelcomePage />
    </UserProvider>
  );
};

export default App;