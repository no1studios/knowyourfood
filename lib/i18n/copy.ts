import type { AppLocale } from '@/lib/i18n';

/** Locked MVP v2 EN|HI copy for the first vertical slice. */
export function copy(locale: AppLocale) {
  const hi = locale === 'hi';
  const x = <T,>(en: T, hindi: T) => (hi ? hindi : en);

  return {
    continue: x('Continue', 'जारी रखें'),
    skip: x('Skip', 'छोड़ें'),
    back: x('Back', 'वापस'),
    step2: x('2 of 3', '2 / 3'),
    step3: x('3 of 3', '3 / 3'),
    lang: {
      title: x('Choose your language', 'अपनी भाषा चुनें'),
      alt: x('अपनी भाषा चुनें', 'Choose your language'),
      note: x(
        'You can change this anytime in Profile',
        'इसे आप प्रोफ़ाइल में कभी भी बदल सकते हैं',
      ),
      enName: 'English',
      enSub: x('Recipes in English', 'Recipes in English'),
      hiName: 'हिंदी',
      hiSub: x('रेसिपी हिंदी में', 'रेसिपी हिंदी में'),
    },
    diet: {
      title: x('What do you cook?', 'आप क्या बनाते हैं?'),
      body: x(
        'Every recipe shows its diet mark. You’ll still see everything.',
        'हर रेसिपी पर डाइट का निशान दिखता है। बाकी रेसिपी भी दिखती रहेंगी।',
      ),
      tiles: [
        {
          key: 'veg' as const,
          name: x('Veg', 'शाकाहारी'),
          sub: x('No meat, fish or egg', 'मांस, मछली, अंडा नहीं'),
        },
        {
          key: 'jain' as const,
          name: x('Jain', 'जैन'),
          sub: x('No onion, garlic or roots', 'प्याज़, लहसुन, कंद नहीं'),
        },
        {
          key: 'egg' as const,
          name: x('Egg', 'अंडा'),
          sub: x('Veg, plus egg', 'शाकाहारी और अंडा'),
        },
        {
          key: 'nonveg' as const,
          name: x('Non-veg', 'मांसाहारी'),
          sub: x('Meat, chicken, fish', 'मीट, चिकन, मछली'),
        },
        {
          key: 'vegan' as const,
          name: x('Vegan', 'वीगन'),
          sub: x('No dairy, meat or egg', 'डेयरी, मांस या अंडा नहीं'),
        },
      ],
    },
    source: {
      title: x('Where do you find recipes?', 'आपको रेसिपी कहाँ मिलती हैं?'),
      body: x(
        'Pick all that apply, then try importing one now.',
        'जो भी लागू हों, चुनें। फिर अभी एक रेसिपी इम्पोर्ट करके देखें।',
      ),
      chips: [
        { key: 'ig' as const, label: 'Instagram', icon: 'camera' as const },
        { key: 'yt' as const, label: 'YouTube', icon: 'image' as const },
        { key: 'web' as const, label: x('Websites', 'वेबसाइट'), icon: 'globe' as const },
        {
          key: 'wa' as const,
          label: x('WhatsApp forwards', 'WhatsApp फ़ॉरवर्ड'),
          icon: 'chat' as const,
        },
        {
          key: 'note' as const,
          label: x('Family notebook', 'घर की कॉपी'),
          icon: 'edit' as const,
        },
        { key: 'book' as const, label: x('Cookbooks', 'कुकबुक'), icon: 'book' as const },
      ],
      field: x('Paste a recipe link', 'रेसिपी का लिंक पेस्ट करें'),
      helper: x(
        'Or import later from My recipes',
        'या बाद में मेरी रेसिपी से इम्पोर्ट करें',
      ),
      cta: x('Import recipe', 'रेसिपी इम्पोर्ट करें'),
      later: x('Skip for now', 'अभी छोड़ें'),
      placeholder: 'instagram.com/reel/…',
    },
    home: {
      title: x('My recipes', 'मेरी रेसिपी'),
      search: x('Search', 'खोजें'),
      list: x('List', 'सूची'),
      heroEyebrow: x('JUST IMPORTED', 'अभी इम्पोर्ट की गई'),
      allLabel: x('ALL RECIPES', 'सभी रेसिपी'),
      fab: x('Import', 'इम्पोर्ट करें'),
      chips: [
        { label: x('All', 'सभी'), count: 12, selected: true },
        { label: x('Dinner', 'रात का खाना'), count: 5 },
        { label: x('Breakfast', 'नाश्ता'), count: 3 },
        { label: x('Sweets', 'मिठाई'), count: 2 },
      ],
      hero: {
        title: x('Dal makhani', 'दाल मखनी'),
        desc: x(
          'Slow-cooked, creamy and smoky — the Sunday kind.',
          'धीमी आँच पर पकी, मलाईदार — रविवार वाली दाल।',
        ),
        tags: [
          { label: x('Dinner', 'रात का खाना'), tone: 'haldi' as const },
          { label: x('Punjabi', 'पंजाबी'), tone: 'mint' as const },
        ],
        time: x('50 min', '50 मिनट'),
        servings: x('4 servings', '4 लोगों के लिए'),
      },
      tiles: [
        {
          title: x('Aloo paratha', 'आलू पराठा'),
          diet: 'veg' as const,
          art: 'roti' as const,
          tone: 'peach' as const,
          time: x('35 min', '35 मिनट'),
        },
        {
          title: x('Masala chai', 'मसाला चाय'),
          diet: 'veg' as const,
          art: 'glass' as const,
          tone: 'sky' as const,
          time: x('10 min', '10 मिनट'),
        },
        {
          title: x('Anda curry, dhaba style', 'ढाबा स्टाइल अंडा करी'),
          diet: 'egg' as const,
          art: 'bowl' as const,
          tone: 'rose' as const,
          time: x('40 min', '40 मिनट'),
        },
        {
          title: x('Kadhi pakora', 'कढ़ी पकौड़ा'),
          diet: 'veg' as const,
          art: 'bowl' as const,
          tone: 'pista' as const,
          time: x('45 min', '45 मिनट'),
        },
      ],
      banner: {
        title: x('Back up your recipes', 'अपनी रेसिपी का बैकअप लें'),
        body: x('12 recipes saved only on this phone', '12 रेसिपी सिर्फ़ इस फ़ोन पर हैं'),
        primary: x('Sign up', 'साइन अप करें'),
      },
    },
    empty: {
      eyebrow: x('Welcome to', 'आपका स्वागत है'),
      title: x('Your recipe box is empty', 'आपकी रेसिपी की डिब्बी खाली है'),
      body: x(
        "Save recipes from Instagram, YouTube or any website — or write down Maa's.",
        'इंस्टाग्राम, यूट्यूब या किसी वेबसाइट से रेसिपी सहेजें — या माँ की रेसिपी खुद लिखें।',
      ),
      action: x('Import a recipe', 'रेसिपी इम्पोर्ट करें'),
      secondary: x('Write my own', 'खुद लिखें'),
    },
    nav: {
      recipes: x('Recipes', 'रेसिपी'),
      search: x('Search', 'खोजें'),
      list: x('List', 'सूची'),
      profile: x('Profile', 'प्रोफ़ाइल'),
    },
    close: x('Close', 'बंद करें'),
    imp: {
      title: x('Import recipe', 'रेसिपी इम्पोर्ट करें'),
      field: x('Recipe link', 'रेसिपी का लिंक'),
      helper: x(
        'Works with Instagram, YouTube and most recipe websites',
        'Instagram, YouTube और ज़्यादातर रेसिपी वेबसाइट से काम करता है',
      ),
      found: x('Recipe found', 'रेसिपी मिल गई'),
      cardTitle: x('Dal makhani', 'दाल मखनी'),
      cardTime: x('50 min', '50 मिनट'),
      cardServ: x('4 servings', '4 लोगों के लिए'),
      counts: x(
        '14 ingredients · 6 steps. You can edit them after saving.',
        '14 सामग्री · 6 स्टेप। सहेजने के बाद आप इन्हें बदल सकते हैं।',
      ),
      other: x('OTHER WAYS', 'और तरीके'),
      ways: [
        { icon: 'camera' as const, tone: 'mint' as const, title: x('Scan a photo', 'फ़ोटो स्कैन करें') },
        { icon: 'chat' as const, tone: 'sky' as const, title: x('Paste text', 'टेक्स्ट पेस्ट करें') },
        { icon: 'edit' as const, tone: 'haldi' as const, title: x('Write it yourself', 'खुद लिखें') },
      ],
      cta: x('Save recipe', 'रेसिपी सहेजें'),
      linkValue: 'instagram.com/reel/C8xK2pL…',
    },
    det: {
      share: x('Share', 'शेयर करें'),
      edit: x('Edit', 'बदलें'),
      saved: x('Saved', 'सहेजी गई'),
      title: x('Dal makhani', 'दाल मखनी'),
      source: x(
        'From @rasoi.with.ritu on Instagram',
        'Instagram पर @rasoi.with.ritu से',
      ),
      tags: [
        { label: x('Dinner', 'रात का खाना'), tone: 'haldi' as const },
        { label: x('Punjabi', 'पंजाबी'), tone: 'mint' as const },
      ],
      stats: [
        { icon: 'clock' as const, v: x('50 min', '50 मिनट'), k: x('Total', 'कुल समय') },
        { icon: 'users' as const, v: '4', k: x('Servings', 'लोग') },
        { icon: 'flame' as const, v: x('Medium', 'मध्यम'), k: x('Spice', 'तीखापन') },
      ],
      tabIng: x('Ingredients', 'सामग्री'),
      tabSteps: x('Steps', 'स्टेप'),
      ing: [
        { title: x('Whole urad dal', 'साबुत उड़द दाल'), qty: x('1 cup', '1 कप') },
        { title: x('Rajma', 'राजमा'), qty: x('¼ cup', '¼ कप') },
        { title: x('Butter', 'मक्खन'), qty: x('3 tbsp', '3 बड़े चम्मच') },
        { title: x('Tomato purée', 'टमाटर प्यूरी'), qty: x('1 cup', '1 कप') },
        { title: x('Fresh cream', 'मलाई'), qty: x('½ cup', '½ कप') },
        { title: x('Kasuri methi', 'कसूरी मेथी'), qty: x('1 tsp', '1 छोटा चम्मच') },
      ],
      steps: [
        x(
          'Soak urad dal and rajma overnight. Pressure cook with salt for 6–7 whistles.',
          'उड़द दाल और राजमा को रात भर भिगोएँ। नमक डालकर 6–7 सीटी तक प्रेशर कुक करें।',
        ),
        x(
          'Heat butter, add ginger-garlic paste and cook for 1 minute.',
          'मक्खन गरम करें, अदरक-लहसुन का पेस्ट डालें और 1 मिनट पकाएँ।',
        ),
        x(
          'Add tomato purée and cook until the butter separates.',
          'टमाटर प्यूरी डालें और मक्खन अलग होने तक पकाएँ।',
        ),
      ],
      cta: x('Add to shopping list', 'शॉपिंग सूची में जोड़ें'),
    },
    share: {
      title: x('Share recipe', 'रेसिपी शेयर करें'),
      subtitle: 'knowyourfood.app/r/dal-482',
      targets: [
        { key: 'wa', icon: 'chat' as const, label: 'WhatsApp', tone: 'mint' as const },
        { key: 'ig', icon: 'camera' as const, label: 'Instagram', tone: 'rose' as const },
        { key: 'link', icon: 'link' as const, label: x('Copy link', 'लिंक कॉपी करें'), tone: 'sky' as const },
        { key: 'img', icon: 'image' as const, label: x('Save card', 'कार्ड सहेजें'), tone: 'haldi' as const },
        { key: 'more', icon: 'more' as const, label: x('More', 'और'), tone: 'neutral' as const },
      ],
      options: [
        {
          icon: 'list' as const,
          title: x('Send ingredients as text', 'सामग्री टेक्स्ट में भेजें'),
          subtitle: x('Best for WhatsApp groups', 'WhatsApp ग्रुप के लिए सबसे अच्छा'),
        },
        {
          icon: 'cart' as const,
          title: x('Add to shopping list', 'शॉपिंग सूची में जोड़ें'),
        },
      ],
    },
    auth: {
      title: x('Back up your recipes', 'अपनी रेसिपी का बैकअप लें'),
      body: x(
        'Sign in with your phone number. Your 12 saved recipes stay on this phone too.',
        'अपने फ़ोन नंबर से साइन इन करें। आपकी 12 रेसिपी इस फ़ोन पर भी रहेंगी।',
      ),
      phone: x('Phone number', 'फ़ोन नंबर'),
      helper: x('You’ll get a 6-digit code by SMS', 'आपको SMS से 6 अंकों का कोड मिलेगा'),
      send: x('Send code', 'कोड भेजें'),
      google: x('Continue with Google', 'Google से जारी रखें'),
      guest: x('Continue as guest', 'मेहमान के रूप में जारी रखें'),
      terms: x(
        'By continuing, you agree to the Terms and Privacy policy.',
        'जारी रखकर आप शर्तों और गोपनीयता नीति से सहमत हैं।',
      ),
      phoneValue: '+91 98765 43210',
    },
    otp: {
      title: x('Enter the code', 'कोड डालें'),
      body: x('Sent by SMS to +91 98765 43210', '+91 98765 43210 पर SMS से भेजा गया'),
      label: x('6-digit code', '6 अंकों का कोड'),
      helper: x('Resend code in 0:24', '0:24 में कोड दोबारा भेजें'),
      cta: x('Verify and continue', 'पुष्टि करें और जारी रखें'),
      change: x('Change number', 'नंबर बदलें'),
    },
  };
}
