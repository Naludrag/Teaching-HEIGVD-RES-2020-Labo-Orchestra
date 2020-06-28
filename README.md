# Teaching-HEIGVD-RES-2020-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**.
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Telegram / Teams, so that everyone in the class can benefit from the discussion.

## Objectives

This lab has 4 objectives:

* The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).

* The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

* The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

* Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.


## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

* the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

* the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)


### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound         |
|------------|---------------|
| `piano`    | `ti-ta-ti`    |
| `trumpet`  | `pouet`       |
| `flute`    | `trulu`       |
| `violin`   | `gzi-gzi`     |
| `drum`     | `boum-boum`   |

### TCP-based protocol to be implemented by the Auditor application

* The auditor should include a TCP server and accept connection requests on port 2205.
* After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab


You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 10 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```
When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.


## Task 1: design the application architecture and protocols

| #  | Topic |
| --- | --- |
|Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands? |
| | ![](./images/Diagram.png) |
|Question | Who is going to **send UDP datagrams** and **when**? |
| | The musician sends UDP datagrams every 1 second as specified in the `Musician` requirements |
|Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received? |
| | The auditor will listen for incoming UDP datagrams. For every new received datagram, the auditor will update the active musician list.|
|Question | What **payload** should we put in the UDP datagrams? |
| | The payload of the UDP datagrams should include the uuid and the instrument of the musician. We thought of including the timestamp, but we decided that it is the auditor's responsibility. |
|Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures? |
| | Data structure for Musician(sender) : The musician needs a constant object containing his UUID and his sound. The muscian will also have a Map to correspond a instrument passed in argument to a sound. We will query on this Map to have the sound of an instrument </br></br> Data structure for auditor(receiver): In order to match a sound (key) with an instrument (value), our auditor will use a Map. An additional map is used to maintain the list of active musicians with the UUID as key. The value is an object with the following properties : instrument, activeSince, lastSeen, timeoutFunction (used to check if the musician is still active after x seconds). The map containing the active Musicians will be updated every time a new Musician send a message. |


## Task 2: implement a "musician" Node.js application

| #  | Topic |
| ---  | --- |
|Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**? |
| | We can use the function `JSON.stringify(object)`.  |
|Question | What is **npm**?  |
| | It is the package manager for NodeJS. Basically the JavaScript equivalent of Maven |
|Question | What is the `npm install` command and what is the purpose of the `--save` flag?  |
| | npm install: install the dependencies passed in parameters or contained in the file package.json into the node_modules directory in the current path. </br> --save: install the dependencies in parameters and save them into the package.json  |
|Question | How can we use the `https://www.npmjs.com/` web site?  |
| | We can simply open the page in a browser in order to search and find packages to install |
|Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122? |
| | By using the uuid package available through npm. [UUID Package ref](https://www.npmjs.com/package/uuid)  |
|Question | In Node.js, how can we execute a function on a **periodic** basis? |
| | We can use the setInterval(callback, nbMilliSeconds) function to execute the callback function periodically. |
|Question | In Node.js, how can we **emit UDP datagrams**? |
| | Node.JS provides a default module named `dgram`. This module provides support for UDP socket and contains a function to send (emit) datagrams. |
|Question | In Node.js, how can we **access the command line arguments**? |
| | The command line arguments are exposed through the `process.argv` object. |


## Task 3: package the "musician" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we **define and build our own Docker image**?|
| | We create a Dockerfile in order to define our own Docker image. This file can easily be built to create an image with the `docker build` command. For instance, `docker build -t .`|
|Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?  |
| | This statement defines the command that will be executed when the container starts. As we'd like to use npm, our statement will be `ENTRYPOINT [ "node", "index.js" ]`.|
|Question | After building our Docker image, how do we use it to **run containers**?  |
| | As specified in the requirements, we should be able to run a musician container with this command : `$ docker run -d res/musician instrumentName`.  |
|Question | How do we get the list of all **running containers**?  |
| | We can use the `docker ps` command to do exactly that.  |
|Question | How do we **stop/kill** one running container?  |
| | Once the container name or ID is obtained, it is possible to run `docker stop name_or_id`/`docker kill name_or_id`.  |
|Question | How can we check that our running containers are effectively sending UDP datagrams?  |
| | The easiest way is to open Wireshark and capture the traffic on the `docker0` interface. Once the capture is started, we can see the UDP datagrams that are being sent by the container. |


## Task 4: implement an "auditor" Node.js application

| #  | Topic |
| ---  | ---  |
|Question | With Node.js, how can we listen for UDP datagrams in a multicast group? |
| | We can use socket.bind(*port, callback*) function to make the dgram.Socket to listen for datagram messages on a named port. Then, in the callback function we also use the socket.addMembership(*multicastAddress*) function. This function will inform the kernel that we want to join a given *multicastAddress* by using the IP_ADD_MEMBERSHIP option in the socket. |
|Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**?  |
| | A Map has the following structure Key=>value which means that a key is unique inside a Map. So, if we want to create a dictionnary the keys will be the words and the values will be the description for the word in the key. |
|Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?  |
| | Moment.js is a module  that have multiple function to calculate the difference between dates. For instance, we have the function *moment(date).startOf('seconds').fromNow()* that permits to have the relative time between a date and the actual time. We tried to use in the first place but it didn't work because it only shows the string "a few seconds ago" and this is not really helpful for our case.</br> In the end we used the diff() function proposed by the module. We implemented it as following *moment().diff(orchestra.get(uuid).lastSeen)* This function will give the miliSeconds that separate the current time(moment()) and the last time a musician give us an information(orchestra.get(uuid).activeSince).|
|Question | When and how do we **get lastSeen of inactive players**?  |
| | We will get rid of inactive players if we didn't receive a datagram(sound) in the last 5 seconds.</br> To delete the inactive musician we implemented a timeout function that will run after 6 seconds without receiving any information(datagram) of a musician.</br> When ran this function will check the difference between the actual time and the last time we receive a message(lastSeen), with the help of the Moment.js module it is simple to do that.</br> If this difference is higher than 5 seconds we delete the musician from the list. If not we let the musician in the list. |
|Question | How do I implement a **simple TCP server** in Node.js?  |
| | First we need to install the **net** module. This module allow us to create a TCP server by using the net.createServer(callback) function. Then, to start the TCP server we need to use the server.listen(ports, address) function. The server will then listen for connection on the given port and address.  |


## Task 5: package the "auditor" app in a Docker image

| #  | Topic |
| ---  | --- |
|Question | How do we validate that the whole system works, once we have built our Docker image? |
| | By using telnet to connect to the container that runs the Auditor app and check if the list returned in response contains all the musicians that we started. Then we delete 1 musician and see if it is still in the list after 5 seconds. |


## Constraints

Please be careful to adhere to the specifications in this document, and in particular

* the Docker image names
* the names of instruments and their sounds
* the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should try to run it.
