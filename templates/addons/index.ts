import * as engine from "@mixery/engine";

addon.register(new engine.GeneratorType("example_generator", {
    name: "Example Generator"
}, generator => {
    const { onNoteDown, onNoteUpUnpredicted } = generator;

    onNoteDown.add(note => {
        console.log(`Note #${note.id}: Note down MIDI = ${note.midi} for ${note.durationSec? `${note.durationSec} seconds` : "n/a"}`);
    });

    onNoteUpUnpredicted.add(note => {
        console.log(`Note #${note.id}: Note up suddenly`);
    });
}));