var program = require('commander');

var path = require('path');
var pkg = require(path.join(__dirname, 'package.json'));

var keypress = require('keypress');

var ansi = require('ansi'),
        cursor = ansi(process.stdout);

var figlet = require('figlet');

var slides = ['Hello World', 'World says hi back', 'This is so interesting', 'Questions ?'];
var currentSlide = 0;

function showSlide() {
    clearScreen();
    figlet(slides[currentSlide], function (err, data) {
        cursor.goto(0, 0).write(data);
    });
    cursor.goto(0, process.stdout.rows).write(currentSlide + 1 + ' / ' + slides.length);
}

function clearScreen() {
    for (var i = 1; i <= process.stdout.rows; i++) {
        cursor.goto(0, i).eraseLine();
    }
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide();
}

function previousSlide() {
    currentSlide = currentSlide - 1;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    showSlide();
}

program
        .version(pkg.version)
        .option('-p, --port <port>', 'Port on which to listen to (defaults to 3000)', parseInt)
        .parse(process.argv);

if (process.stdout.isTTY) {
    keypress(process.stdin);

    // listen for the "keypress" event
    process.stdin.on('keypress', function (ch, key) {
        if (key && ((key.ctrl && key.name == 'c') || (key.name == 'escape') || (key.name == 'q'))) {
            process.stdin.pause();
            cursor.reset();
            cursor.goto(0, process.stdout.columns);
            console.log('\nBye!');
        }
        else if (key && key.name == 'left') {
            previousSlide();
        }
        else if (key && (key.name == 'right' || key.name == 'space')) {
            nextSlide();
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    cursor.hide();

    showSlide();
} else {
    console.log("Please run this in console enviroment (I need TTY!)");
}
