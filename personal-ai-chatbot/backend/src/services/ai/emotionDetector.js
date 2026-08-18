export const detectEmotion = (message = "") => {
  const lower = message.toLowerCase();

  const emotionPatterns = {
    senang: {
      patterns: [/\bsenang\b/i, /\bbahagia\b/i, /\bkeren\b/i, /\bmantap\b/i, /\bbagus\b/i, /\bhebat\b/i, /\bwah\b/i, /\basik\b/i, /\bseru\b/i, /\boke\b/i, /\byey\b/i, /\bhore\b/i],
      intensity: 0.7,
      response: "senang",
    },
    kesal: {
      patterns: [/\bkesal\b/i, /\bmarah\b/i, /\bjengkel\b/i, /\bbenci\b/i, /\bsial\b/i, /\banjir\b/i, /\bwaduh\b/i, /\bbego\b/i, /\bbodoh\b/i, /\btolol\b/i],
      intensity: 0.6,
      response: "kesal",
    },
    sedih: {
      patterns: [/\bsedih\b/i, /\bgalau\b/i, /\bsusah\b/i, /\blemah\b/i, /\bpayah\b/i, /\bmenyesal\b/i, /\bkecewa\b/i, /\bsabar\b/i],
      intensity: 0.5,
      response: "sedih",
    },
    lucu: {
      patterns: [/\bhaha\b/i, /\bwkwk\b/i, /\blol\b/i, /\blmao\b/i, /\bngakak\b/i],
      intensity: 0.8,
      response: "lucu",
    },
    terima_kasih: {
      patterns: [/\bterima kasih\b/i, /\bthanks\b/i, /\bmakasih\b/i, /\bthx\b/i, /\btrimakasih\b/i, /\bmatur nuwun\b/i],
      intensity: 0.9,
      response: "terima_kasih",
    },
    kesalahan: {
      patterns: [/\bmaaf\b/i, /\bsorry\b/i, /\bapologize\b/i, /\bforgive\b/i, /\bminta maaf\b/i],
      intensity: 0.4,
      response: "maaf",
    },
  };

  for (const [emotion, config] of Object.entries(emotionPatterns)) {
    if (config.patterns.some((pattern) => pattern.test(lower))) {
      return {
        emotion,
        intensity: config.intensity,
        response: config.response,
      };
    }
  }

  return { emotion: "netral", intensity: 0, response: "netral" };
};
