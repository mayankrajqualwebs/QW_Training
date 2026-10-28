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


import React, { useState, useEffect } from 'react';
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

const App = () => {
  const COMPANY = ["GEEKS", "FOR", "GEEKS"];
  const handleClick = (COMPANY) => {
    alert(`You clicked on ${COMPANY}`);
  };

  return (
    <ul>
      {COMPANY.map((COMPANY, index) => (
        <button key={index} onClick={() => handleClick(COMPANY)}>
          {COMPANY}
        </button>
      ))}
    </ul>
  );
};
export default App;