// requirements

var program = require('commander');
var path = require('path');
var pkg = require(path.join(__dirname, 'package.json'));

var keypress = require('keypress');

var ansi = require('ansi'),
        cursor = ansi(process.stdout);

var figlet = require('figlet');

var fs = require('fs');

var ImageToAscii = require("image-to-ascii");

// ----

var slides = [];
var currentSlide = 0;

// ---- GLOBALS

var author = '';
var font = 'Standard';
var created = '';

// ----

function showSlide() {
    clearScreen();
    if (slides[currentSlide].indexOf('IMAGE') == 0) {
        var image = slides[currentSlide].substring('IMAGE'.length).trim();
        console.log(image);
        ImageToAscii(image, function(err, result){
            if (err) {
                console.log(err);
            }
            cursor.goto(0, 0).write(result);
        });
    }
    else {
        var text = figlet.textSync(slides[currentSlide], {
            font: font,
            horizontalLayout: 'default',
            verticalLayout: 'default'
        });
        cursor.goto(0, 0).write(text);
    }

    cursor.goto(0, process.stdout.rows).write(currentSlide + 1 + ' / ' + slides.length);

    if (author) {
        var authorText = 'by ' + author;
        cursor.goto(process.stdout.columns - authorText.length, process.stdout.rows).write(authorText);
    }
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

function isNewLine(line) {
    return line.trim().match(/===(=)*/)
}

function readSlides(data) {
    var file = data.trim();

    var lines = file.split('\n');
    var lineAt = 0;

    if (file.trim().charAt(0) == '{')  {
        // file has a json prologue
        var json = '';
        while (lineAt < lines.length && !isNewLine(lines[lineAt++])) {
            json += lines[lineAt-1];
        }
        var json = JSON.parse(json);
        author = json.author ? json.author : '';
        font = json.font ? json.font : 'Standard';
        created = json.created ? json.created : '';
    }

    var slide = '';
    while (lineAt < lines.length) {
        if (isNewLine(lines[lineAt])) {
            addNewSlide(slide);
            slide = '';
        } else {
            slide += lines[lineAt] + '\n';
        }
        lineAt++;
    }

    // there might be no newline at the end
    if (slide.trim().length > 0) {
        addNewSlide(slide);
    }
}

function addNewSlide(slide) {
    slides.push(slide);
}

program
        .version(pkg.version)
        .usage('[options] <file>')
        .parse(process.argv);

if (process.stdout.isTTY) {

    if (!program.args[0]) {
        console.log('Please specify asciipresent file');
        process.exit(-1);
    }

    var file = program.args[0];

    fs.readFile(file, 'utf8', function (err,data) {
        if (err) {
            console.log(err);
            process.exit(-1);
        }

        readSlides(data);

        showSlide();
    });

    keypress(process.stdin);

    // listen for the "keypress" event
    process.stdin.on('keypress', function (ch, key) {
        if (key && ((key.ctrl && key.name == 'c') || (key.name == 'escape') || (key.name == 'q'))) {
            process.stdin.pause();
            cursor.reset();
            cursor.show();
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
} else {
    console.log("Please run this in console enviroment (I need TTY!)");
}
