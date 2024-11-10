// Previous imports remain the same...

export class StreamProcessor {
  // Previous class properties remain the same...

  private getFFmpegArgs(destination: string): string[] {
    const srtUrl = new URL(destination);
    const params = new URLSearchParams(srtUrl.search);
    
    const baseArgs = [
      '-fflags', '+genpts+nobuffer+flush_packets',
      '-thread_queue_size', '1024',
      '-analyzeduration', '100000',
      '-probesize', '100000',
      '-i', 'pipe:0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-profile:v', 'high',
      '-level', '4.1',
      '-vf', [
        'scale=1920:-2',
        'crop=1920:1080:0:(ih-1080)/2',
        'format=yuv420p'
      ].join(','),
      '-b:v', '4000k',
      '-maxrate', '4000k',
      '-bufsize', '8000k',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '48000',
      '-ac', '2',
      '-g', '15',
      '-keyint_min', '15',
      '-sc_threshold', '0',
      '-force_key_frames', 'expr:gte(t,n_forced*0.5)',
    ];

    // Add SRT specific options
    const srtArgs = [
      '-f', 'mpegts',
      '-flush_packets', '1',
      '-max_delay', '0',
      '-muxdelay', '0',
      '-muxpreload', '0'
    ];

    // Add SRT URL with credentials
    const mode = params.get('mode') || 'caller';
    const passphrase = params.get('passphrase');
    const streamid = params.get('streamid');
    const latency = params.get('latency') || '200';

    let srtOptions = `srt://${srtUrl.hostname}:${srtUrl.port}?mode=${mode}&latency=${latency}`;
    if (passphrase) {
      srtOptions += `&passphrase=${passphrase}`;
    }
    if (streamid) {
      srtOptions += `&streamid=${streamid}`;
    }

    return [...baseArgs, ...srtArgs, srtOptions];
  }

  // Rest of the class implementation remains the same...
}