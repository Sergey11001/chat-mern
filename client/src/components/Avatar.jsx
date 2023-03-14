import React from 'react';

const Avatar = ({userId, letter, online}) => {
    const colors = ['bg-red-400', 'bg-green-400', 'bg-blue-400', 'bg-yellow-400', 'bg-purple-400', 'bg-teal-400']
    const userIdBase10 = parseInt(userId, 10) % colors.length
    const color = colors[userIdBase10]
    return (
        <div className={"w-10 h-10 rounded-full flex flex-col items-center justify-center text-xl text-white relative " + color}>
            <div className="text-center w-full">{letter}</div>
            <div className={"rounded-full w-2.5 h-2.5 border absolute bottom-0 right-0 " + (online ? "bg-green-400" : "bg-gray-400")}></div>
        </div>
    );
};

export default Avatar;