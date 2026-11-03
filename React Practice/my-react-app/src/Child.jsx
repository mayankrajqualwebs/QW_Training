// import React, { Component } from 'react';

// class Child extends Component {
//     handleClick = () => {
//         alert(this.props.greeting);
//     };

//     render() {
//         return (
//             <div className="child-container">
//                 <h2>Child Component</h2>
//                 <button onClick={this.handleClick}>Click to See Greeting</button>
//             </div>
//         );
//     }
// }

// export default Child;

import React from 'react';

function Child({ onClickHandler }) {
    const buttonStyle = {
        padding: "12px 24px",
        fontSize: "16px",
        color: "white",
        backgroundColor: "#007bff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "background-color 0.3s",
    };

    const buttonHoverStyle = {
        backgroundColor: "#0056b3",
    };

    return (
        <div>
            <h2>Child Component</h2>
            {/* Button to call the event handler */}
            <button
                onClick={onClickHandler}
                style={buttonStyle}
                onMouseOver={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
            >
                Click Me!
            </button>
        </div>
    );
}

export default Child;