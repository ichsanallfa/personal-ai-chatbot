import asyncio
import sys
import edge_tts

async def main():
    text = sys.stdin.read().strip()
    if not text:
        return
    voice = sys.argv[1] if len(sys.argv) > 1 else "id-ID-GadisNeural"
    pitch = sys.argv[2] if len(sys.argv) > 2 else "+25Hz"
    rate = sys.argv[3] if len(sys.argv) > 3 else "+10%"

    comm = edge_tts.Communicate(text, voice, pitch=pitch, rate=rate)
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            sys.stdout.buffer.write(chunk["data"])
            sys.stdout.buffer.flush()

if __name__ == "__main__":
    asyncio.run(main())
