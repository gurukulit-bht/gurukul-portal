import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, Lock, CheckCircle2, Star, Trophy, Download, RotateCcw, Home, ArrowLeft, Sparkles, Copy, Check, ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
};

type Chapter = {
  id: string;
  title: string;
  emoji: string;
  value: string;
  story: string;
  example: string;
  takeaway: string;
  quiz: QuizQuestion[];
};

type Course = {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  cardBg: string;
  accent: string;
  textAccent: string;
  description: string;
  badge: string;
  badgeEmoji: string;
  character: string;
  chapters: Chapter[];
};

type Progress = {
  completed: string[];
};

// ─── Course Content ───────────────────────────────────────────────────────────

const COURSES: Course[] = [
  {
    id: "know-your-ram",
    title: "Know Your Ram",
    emoji: "🏹",
    gradient: "from-orange-400 via-amber-400 to-yellow-300",
    cardBg: "bg-gradient-to-br from-orange-50 to-yellow-50",
    accent: "bg-orange-400",
    textAccent: "text-orange-500",
    description: "Join Ram on an epic adventure of love, courage, and victory! 🌟 Travel through jungles, meet Hanuman, and see how goodness always wins!",
    badge: "Ram Hero",
    badgeEmoji: "🏹",
    character: "🐚",
    chapters: [
      {
        id: "birth-of-ram",
        title: "Birth of Ram 👶",
        emoji: "👶",
        value: "Love & Blessings",
        story: `Long, long ago in the beautiful kingdom of Ayodhya, there lived a kind and wise king named Dasharatha. He had three queens — Kaushalya, Kaikeyi, and Sumitra — and they all loved each other dearly.\n\nKing Dasharatha had everything — gold, elephants, and a mighty army — but his heart was sad because he had no children. He prayed and prayed to God with all his love.\n\nGod heard his prayers! 🙏 A special sacred pudding called "Payasam" appeared, and the queens ate it. Soon, four wonderful princes were born:\n\n🌟 Ram — from Queen Kaushalya — the eldest and most virtuous\n💛 Bharat — from Queen Kaikeyi\n✨ Lakshman and Shatrughan — from Queen Sumitra\n\nThe whole kingdom celebrated with flowers, music, and sweets! Ram was special from birth — calm, kind, and always smiling. Even as a baby, everyone could feel his goodness.`,
        example: "Just like Ram was a blessing to his parents, YOU are a blessing to your family! 💕",
        takeaway: "Every child is a gift from God. Be kind and fill your home with love! ❤️",
        quiz: [
          {
            question: "What was the name of Ram's kingdom? 🏰",
            options: ["Lanka 🌴", "Ayodhya 🏰", "Mathura 🌸", "Dwarka 🌊"],
            correct: 1,
          },
          {
            question: "How many princes were born to King Dasharatha? 👦",
            options: ["Two 2️⃣", "Three 3️⃣", "Four 4️⃣", "Five 5️⃣"],
            correct: 2,
          },
          {
            question: "What special food appeared as a blessing? 🍮",
            options: ["Ladoo 🍬", "Kheer 🍚", "Payasam 🍮", "Halwa 🍯"],
            correct: 2,
          },
          {
            question: "Ram was born from which queen? 👑",
            options: ["Kaikeyi 💄", "Sumitra 🌸", "Kaushalya 👑", "None of these"],
            correct: 2,
          },
        ],
      },
      {
        id: "ram-and-sita",
        title: "Ram & Sita 💛",
        emoji: "💛",
        value: "Love & Respect",
        story: `When Ram grew up, he became a handsome, strong, and wise prince. Sage Vishwamitra took Ram and Lakshman on many adventures to protect the good people.\n\nOne day, they traveled to the kingdom of Mithila, ruled by the noble King Janaka. King Janaka had a beautiful and brilliant daughter named Sita — she had been found as a baby in the earth while her father was plowing a field! 🌱 Sita loved helping others and was full of wisdom.\n\nKing Janaka had a challenge: whoever could lift and string the mighty bow of Lord Shiva would win Sita's hand. 🏹 Many powerful kings tried and failed — the bow was too heavy!\n\nWhen Ram stepped forward, the entire hall went quiet. With grace and strength, Ram not only lifted the bow but bent it so powerfully that it BROKE with a thunderous sound! 💥\n\nThe whole assembly cheered! Ram and Sita looked at each other and both knew — they were meant for each other. Their wedding was the happiest celebration Mithila had ever seen! 🎊`,
        example: "True love is about respect and kindness — just like Ram always treated Sita with the greatest care! 💕",
        takeaway: "Respect and kindness are the foundation of every beautiful relationship! 💛",
        quiz: [
          {
            question: "Where was Sita found as a baby? 🌱",
            options: ["In a river 🌊", "In a forest 🌳", "In the earth while plowing 🌱", "In the sky ☁️"],
            correct: 2,
          },
          {
            question: "What challenge did King Janaka set? 🏹",
            options: ["Win a race 🏃", "Lift and string Shiva's bow 🏹", "Slay a demon 👹", "Build a palace 🏰"],
            correct: 1,
          },
          {
            question: "Who was Sita's father? 👑",
            options: ["King Dasharatha 👑", "King Janaka 🌾", "King Ravana 😈", "Sage Vishwamitra 🧙"],
            correct: 1,
          },
          {
            question: "What happened to the bow when Ram picked it up? 💥",
            options: ["It flew away 🌪️", "It glowed golden ✨", "It broke! 💥", "It got heavier ⬇️"],
            correct: 2,
          },
        ],
      },
      {
        id: "vanvas",
        title: "Vanvas 🌳",
        emoji: "🌳",
        value: "Duty & Sacrifice",
        story: `Life was perfect in Ayodhya until one day, Queen Kaikeyi — influenced by her wicked maid Manthara — asked King Dasharatha for two old promises: send Ram to the forest for 14 years, and make her son Bharat the king! 😢\n\nThe poor king was heartbroken! He loved Ram more than anything. But a king must keep his promises.\n\nWhen Ram heard the news, do you know what he did? He SMILED! 😊 "Father made a promise. I must keep it," Ram said calmly. He changed his royal clothes for simple forest ones and prepared to leave.\n\nBut Sita and Lakshman refused to stay behind! "Where Ram goes, I go," said Sita. "My brother shall not face the forest alone," said Lakshman.\n\nThe three of them walked into the deep green forest. The people of Ayodhya cried as they watched their beloved prince leave.\n\nIn the forest, Ram lived simply — eating fruits, sleeping under stars, and helping sages and poor people they met. Even in difficulty, Ram remained happy, calm, and kind. That is his greatness! 🌟`,
        example: "Have you ever done something hard because it was the right thing to do? That's exactly what Ram did — and it made him a hero! 💪",
        takeaway: "True heroes do their duty even when it's hard. Kindness and calmness make difficult times easier! 🌳",
        quiz: [
          {
            question: "For how many years did Ram go to the forest? 🌳",
            options: ["7 years 🔢", "10 years 🔢", "14 years 🌳", "20 years 🔢"],
            correct: 2,
          },
          {
            question: "Who asked for Ram to be sent to the forest? 😤",
            options: ["Queen Kaushalya 💕", "Queen Kaikeyi 😤", "Sage Vishwamitra 🧙", "Ravana 😈"],
            correct: 1,
          },
          {
            question: "Who went to the forest with Ram? 🌿",
            options: ["Only Sita 💛", "Only Lakshman 🏹", "Sita and Lakshman 🌿", "All the princes 👦"],
            correct: 2,
          },
          {
            question: "How did Ram feel about going to the forest? 😊",
            options: ["Very angry 😡", "Very sad 😢", "He accepted it calmly 😊", "He refused to go 🙅"],
            correct: 2,
          },
        ],
      },
      {
        id: "hanumans-leap",
        title: "Hanuman's Leap 🐒",
        emoji: "🐒",
        value: "Courage & Devotion",
        story: `While living in the forest, something terrible happened — the demon king Ravana, disguised as a holy man, tricked Sita and kidnapped her! 😰 He took her in his flying chariot to his island kingdom of Lanka.\n\nRam and Lakshman searched everywhere with heavy hearts. Then they met Sugriva, the monkey king, and his best friend — HANUMAN! 🐒✨\n\nHanuman was extraordinary — he had the power to fly, change his size, and move as fast as the wind! But most importantly, he had a heart full of love and devotion for Ram.\n\nWhen the monkey army reached the southern sea, even they lost hope — Lanka was across the vast ocean! But Hanuman closed his eyes, thought of Ram, and suddenly began to GROW bigger and bigger! ⬆️⬆️⬆️\n\nWith a mighty roar, Hanuman leaped into the sky and flew across the ocean! The waves parted, the clouds cheered, and mountains bowed as he soared over them.\n\nHanuman found Sita sitting under an Ashoka tree in Lanka. He showed her Ram's ring as proof — "Ram is coming! He has not forgotten you!" 💍\n\nSita's eyes filled with happy tears. Hope was alive! 🌟`,
        example: "When you feel scared but do the right thing anyway — that's REAL courage! Just like Hanuman! 🦁",
        takeaway: "With faith and love in your heart, you can overcome any challenge! Jai Hanuman! 🐒💪",
        quiz: [
          {
            question: "Who kidnapped Sita? 😈",
            options: ["Sugriva 🐒", "Ravana 😈", "Kaikeyi 😤", "Manthara 🐍"],
            correct: 1,
          },
          {
            question: "What made Hanuman special? ✨",
            options: ["He had a big sword ⚔️", "He could fly and change size ✨", "He was very rich 💰", "He was the tallest 📏"],
            correct: 1,
          },
          {
            question: "What did Hanuman show Sita as proof from Ram? 💍",
            options: ["A letter 📜", "His smile 😊", "Ram's ring 💍", "A flower 🌸"],
            correct: 2,
          },
          {
            question: "Where was Sita kept in Lanka? 🌳",
            options: ["In a golden cage 🪤", "Under an Ashoka tree 🌳", "In Ravana's palace 🏰", "Near the ocean 🌊"],
            correct: 1,
          },
        ],
      },
      {
        id: "battle-with-ravana",
        title: "Battle with Ravana ⚔️",
        emoji: "⚔️",
        value: "Courage & Justice",
        story: `Ram built a bridge of floating stones across the ocean — every stone had "Ram" written on it and they floated by the power of love and faith! 🪨✨\n\nThe great army of monkeys and bears crossed over to Lanka. The battle began! For many days, heroes fought on both sides.\n\nRavana was powerful — he had ten heads and could regenerate! Every time Ram cut off a head, another grew back. But Ram had a secret weapon — not a sword, but RIGHTEOUSNESS! 🌟\n\nFinally, the wise Agastya Muni taught Ram the Aditya Hridayam prayer — praise of the Sun God who destroys darkness. Ram prayed with full focus and faith.\n\nThen Ram aimed his divine arrow — it went through Ravana's chest and removed the nectar of immortality hidden in his navel. Ravana finally fell! ⚡\n\nGoodness had defeated evil! 🌟 Truth had defeated lies! Light had defeated darkness!\n\nThe whole universe celebrated — flowers rained from the sky, gods cheered, and Sita was free at last! 🎊💕`,
        example: "Just like Ram's goodness defeated Ravana's evil, always choose to be truthful and kind — goodness ALWAYS wins! ✨",
        takeaway: "Never give up! With righteousness, faith, and courage, good always wins over evil! ⚔️🌟",
        quiz: [
          {
            question: "How did Ram's bridge stay afloat? 🪨",
            options: ["By magic spells 🪄", "Because the stones had 'Ram' written 🪨", "By iron rods 🔩", "By Hanuman's strength 💪"],
            correct: 1,
          },
          {
            question: "How many heads did Ravana have? 👹",
            options: ["Five 5️⃣", "Seven 7️⃣", "Ten 🔟", "Twelve 🔢"],
            correct: 2,
          },
          {
            question: "Where was Ravana's immortality hidden? ✨",
            options: ["In his heads 😤", "In his chest 💪", "In his navel 🎯", "In his crown 👑"],
            correct: 2,
          },
          {
            question: "What happened after Ravana was defeated? 🎊",
            options: ["It started raining 🌧️", "Flowers rained from sky, gods cheered 🎊", "Everyone went home quietly 🏠", "The ocean flooded 🌊"],
            correct: 1,
          },
        ],
      },
      {
        id: "return-to-ayodhya",
        title: "Return to Ayodhya 🏰",
        emoji: "🏰",
        value: "Gratitude & Service",
        story: `After 14 long years, Ram, Sita, and Lakshman returned to Ayodhya! They flew back in Ravana's magical flying chariot — the Pushpaka Vimana — which moved through the clouds like a floating palace! ☁️✨\n\nThe whole kingdom of Ayodhya was waiting! As their chariot descended, the people lit millions of tiny lamps (diyas) to welcome them home. Every home, every street, every tree was glowing with warm golden light. 🪔🪔🪔\n\nThis day of lights became the most joyful celebration ever — we call it DIWALI! 🎇🎉\n\nRam became king and ruled with wisdom, fairness, and kindness. His rule was so perfect that even today, when we want to describe an ideal world, we call it "Ram Rajya" — the Kingdom of Ram.\n\nIn Ram Rajya:\n✅ Everyone was healthy and happy\n✅ No one was poor or hungry\n✅ Truth and justice ruled\n✅ All people, animals, and nature were cared for\n\nRam never forgot where he came from. He always thanked Hanuman, his brother Lakshman, and all those who helped him. Gratitude was his greatest quality! 🙏`,
        example: "Say thank you to everyone who helps you — your parents, teachers, and friends. Gratitude makes the world shine like Diwali! 🪔",
        takeaway: "Serve others with love, be grateful always, and bring light into everyone's life — that is Ram's greatest teaching! 🏰🌟",
        quiz: [
          {
            question: "What is the name of the flying chariot Ram used? ✈️",
            options: ["Garuda Vimana 🦅", "Pushpaka Vimana ✨", "Swarna Vimana 🌟", "Surya Vimana ☀️"],
            correct: 1,
          },
          {
            question: "Why did people light diyas when Ram returned? 🪔",
            options: ["It was very dark 🌑", "To welcome Ram home and celebrate 🪔", "It was Ram's birthday 🎂", "To scare demons away 😈"],
            correct: 1,
          },
          {
            question: "What do we call Ram's ideal kingdom? 👑",
            options: ["Lanka Rajya 🌴", "Mithila Rajya 🌸", "Ram Rajya 👑", "Ayodhya Rajya 🏰"],
            correct: 2,
          },
          {
            question: "What celebration do we remember the return of Ram with? 🎇",
            options: ["Holi 🎨", "Navratri 🌺", "Diwali 🎇", "Janmashtami 🍼"],
            correct: 2,
          },
        ],
      },
    ],
  },
  {
    id: "geeta-gyan",
    title: "Geeta Gyan",
    emoji: "🪔",
    gradient: "from-violet-500 via-purple-400 to-indigo-400",
    cardBg: "bg-gradient-to-br from-violet-50 to-indigo-50",
    accent: "bg-violet-500",
    textAccent: "text-violet-600",
    description: "Discover the timeless wisdom of the Bhagavad Geeta! 📖 Krishna's simple and powerful teachings will help you live a happy, strong, and peaceful life!",
    badge: "Geeta Star",
    badgeEmoji: "🪔",
    character: "🦚",
    chapters: [
      {
        id: "what-is-geeta",
        title: "What is Geeta? 📖",
        emoji: "📖",
        value: "Wisdom & Knowledge",
        story: `Imagine having a best friend who is always wise, loving, and knows the answer to every problem in life. For us, that friend is Lord Krishna — and the Bhagavad Geeta is his wonderful conversation! 🦚💛\n\nLong ago, two families — the Pandavas and Kauravas — were about to fight a great battle at a place called Kurukshetra. Arjuna, the bravest warrior of the Pandavas, was ready to fight.\n\nBut when he saw his own cousins, teachers, and relatives on the other side, Arjuna dropped his bow and started crying! 😢 "How can I fight my own family?" he asked.\n\nKrishna — who was Arjuna's chariot driver and best friend — stopped the chariot between the two armies and said, "Arjuna, let me tell you the truth about life!" 🌟\n\nFor a long time, Krishna spoke wisdom to Arjuna. These teachings were so beautiful and true that they have guided millions of people for thousands of years! That conversation is the Bhagavad Geeta — 700 verses of divine wisdom! 📖✨\n\nEven today, scientists, leaders, students, and children around the world read the Geeta to find peace, strength, and purpose in life!`,
        example: "Have you ever had a problem and needed a wise friend's advice? The Geeta is like having Krishna as your wisest friend, always! 🦚",
        takeaway: "The Geeta teaches us how to live happily, do good, and never give up! It's wisdom for everyone, forever! 📖✨",
        quiz: [
          {
            question: "Where did Krishna share the Geeta's wisdom? 🏟️",
            options: ["In a temple 🛕", "At Kurukshetra battlefield 🏟️", "In a forest 🌳", "In a classroom 🏫"],
            correct: 1,
          },
          {
            question: "Why did Arjuna start crying before the battle? 😢",
            options: ["He was scared of war ⚔️", "He lost his bow 🏹", "He saw his family on the other side 😢", "Krishna scolded him 😤"],
            correct: 2,
          },
          {
            question: "Who was Krishna to Arjuna during the battle? 🦚",
            options: ["His enemy 😤", "His chariot driver & best friend 🦚", "His teacher at school 🏫", "His brother 👦"],
            correct: 1,
          },
          {
            question: "How many verses does the Bhagavad Geeta have? 📖",
            options: ["100 verses 💯", "500 verses 5️⃣", "700 verses 📖", "1000 verses 🔢"],
            correct: 2,
          },
        ],
      },
      {
        id: "do-your-duty",
        title: "Do Your Duty 💪",
        emoji: "💪",
        value: "Karma & Hard Work",
        story: `Krishna told Arjuna: "You have the right to perform your actions, but you are not entitled to the fruits of your actions." What does this mean? Let's find out! 🌟\n\nImagine you work really hard for a school project. You paint beautifully, write neatly, and give your best. But someone else wins the prize. You feel sad, right?\n\nKrishna says: Focus on doing your BEST, not on winning or losing! 🎯\n\nWhy? Because:\n✅ We can control HOW MUCH effort we put in\n❌ We CANNOT always control the result\n\nIf a farmer plants seeds carefully and waters them with love, he has done his duty. 🌱 Whether rain comes or not is not in his hands. But he will never regret because he did his best!\n\nThis teaching is called "Nishkama Karma" — doing your duty without worrying about reward.\n\nKrishna says: When you act without selfishness and give your 100%, you will always be at peace — win or lose! 😊\n\nThe happiest people in the world are those who love their work, not those who only wait for rewards! 💪`,
        example: "Next time you study for a test — study your BEST, not just to get marks. Then whatever happens, you'll be proud! 📚💪",
        takeaway: "Give 100% to everything you do. Don't worry about rewards — your honest effort is your true victory! 💪🌟",
        quiz: [
          {
            question: "What does 'Nishkama Karma' mean? 🌸",
            options: ["Doing work for money 💰", "Doing duty without worrying about reward 🌸", "Avoiding all work 😴", "Waiting for others to work 🛋️"],
            correct: 1,
          },
          {
            question: "According to Krishna, what CAN you control? ✅",
            options: ["The result 🏆", "Other people's actions 🤷", "Your own effort and action 💪", "The weather ☁️"],
            correct: 2,
          },
          {
            question: "What is the best way to feel at peace after doing something? 😊",
            options: ["Always win 🏆", "Give your honest best effort 💪", "Never try anything difficult 😴", "Copy from others 📋"],
            correct: 1,
          },
          {
            question: "In Krishna's teaching, who are the happiest people? 😄",
            options: ["Those with the most money 💰", "Those who win every time 🏆", "Those who love their work 😄", "Those who do nothing 😴"],
            correct: 2,
          },
        ],
      },
      {
        id: "stay-focused",
        title: "Stay Focused 🎯",
        emoji: "🎯",
        value: "Concentration & Discipline",
        story: `Do you know why Arjuna was the greatest archer in the world? 🏹 Because of a lesson he learned from his teacher Drona long before the battle!\n\nOne day, Drona placed a bird on a branch and asked all his students: "What do you see?"\n\n"I see the tree, the branches, the leaves, and the bird!" said the other students.\n\nArjuna said: "I see only the bird's eye!" 🎯\n\nThat is the power of FOCUS! That single-pointed attention — called "Ekagrata" — is Krishna's teaching in the Geeta too! 🌟\n\nKrishna says the human mind is like a monkey — it jumps from thought to thought, place to place, worry to worry! 🐒 But with practice and patience, we can train our mind to be still like a calm lake. 🌊\n\nHow to stay focused:\n✅ Do one thing at a time\n✅ Put away distractions (phone, TV) when studying\n✅ Take slow deep breaths when your mind wanders\n✅ Practice daily — even 5 minutes of quiet focus helps!\n\nWhen your mind is focused, learning becomes faster, results become better, and you enjoy what you do much more! 😊`,
        example: "Before studying, sit quietly for 2 minutes and think: 'I will focus on this one thing!' — it really works! 🎯",
        takeaway: "A focused mind is a powerful mind! Train your attention every day and you will amaze yourself! 🎯✨",
        quiz: [
          {
            question: "What did Arjuna see when Drona asked 'What do you see?' 🎯",
            options: ["The whole forest 🌳", "The tree and branches 🌲", "Only the bird's eye 🎯", "The sky and clouds ☁️"],
            correct: 2,
          },
          {
            question: "What is 'Ekagrata'? 🌟",
            options: ["A type of food 🍱", "Single-pointed focus and attention 🎯", "A prayer 🙏", "A dance 💃"],
            correct: 1,
          },
          {
            question: "Krishna compares the human mind to which animal? 🐒",
            options: ["An elephant 🐘", "A lion 🦁", "A monkey 🐒", "A horse 🐴"],
            correct: 2,
          },
          {
            question: "Which of these helps you stay focused? ✅",
            options: ["Watching TV while studying 📺", "Doing many things at once 🌀", "Breathing slowly and doing one thing at a time 🎯", "Eating snacks constantly 🍫"],
            correct: 2,
          },
        ],
      },
      {
        id: "control-your-mind",
        title: "Control Your Mind 🧠",
        emoji: "🧠",
        value: "Self-Control & Peace",
        story: `"The mind is your best friend, and also your worst enemy!" — Krishna, Bhagavad Geeta 🌟\n\nWhen your mind is calm and under your control — it becomes your BEST FRIEND. It helps you make good decisions, feel happy, and be kind to others. 😊\n\nBut when your mind is wild and you let anger, jealousy, or fear control you — it becomes your WORST ENEMY! 😤\n\nHave you ever gotten angry and said something unkind, and then felt bad about it later? That's the wild mind taking over!\n\nKrishna teaches us that we are NOT our thoughts and feelings. We are the OBSERVER of our thoughts — we can watch them come and go like clouds in the sky! ☁️\n\nHow to be the master of your mind:\n🧘 Practice sitting quietly (even 2 minutes a day!)\n🌬️ When angry, take 5 slow deep breaths before speaking\n🤔 Ask yourself: "Will this matter in 5 years?" before reacting\n💕 Think of something you love when you feel worried\n🙏 Chant "Om" or any prayer — it calms the mind like magic!\n\nThe strongest person in the world is not the one with the biggest muscles — it's the one who can control their own mind! 💪🧠`,
        example: "Next time you feel angry or upset, count to 10 slowly. That's actually you taking control of your mind! 🧠✨",
        takeaway: "You are stronger than your feelings! Train your mind to be calm and you will become unstoppable! 🧠💪",
        quiz: [
          {
            question: "According to Krishna, when is the mind your best friend? 😊",
            options: ["When it thinks a lot 🤯", "When it is calm and under control 😊", "When it is angry 😠", "When it sleeps 😴"],
            correct: 1,
          },
          {
            question: "What should you do when you feel very angry? 😤",
            options: ["Shout loudly 📢", "Hit something 👊", "Take slow deep breaths and count 🌬️", "Eat lots of candy 🍬"],
            correct: 2,
          },
          {
            question: "Krishna says we are the ___ of our thoughts! 👁️",
            options: ["Creator 🔨", "Slave ⛓️", "Observer 👁️", "Destroyer 💥"],
            correct: 2,
          },
          {
            question: "Who is the STRONGEST person according to Geeta? 💪",
            options: ["The tallest person 📏", "The richest person 💰", "One who controls their own mind 🧠", "The fastest runner 🏃"],
            correct: 2,
          },
        ],
      },
      {
        id: "good-choices",
        title: "Good Choices 👍",
        emoji: "👍",
        value: "Wisdom & Discernment",
        story: `Every single day, we make hundreds of choices — big and small! What to eat, how to talk to a friend, whether to help someone, whether to tell the truth. 🤔\n\nKrishna teaches us there are two kinds of choices:\n\n🌟 SHREYA (Good Choices) — What is truly good for you and others, even if it's hard\n💔 PREYA (Pleasant Choices) — What feels nice RIGHT NOW but may hurt you later\n\nExample:\n🍭 Eating 10 candies = PREYA (feels great now, tummy ache later!)\n🥗 Eating healthy food = SHREYA (not as exciting, but body becomes strong!)\n\n📚 Playing games instead of studying = PREYA\n📖 Studying first, then playing = SHREYA\n\nKrishna says: Wise people choose SHREYA — what is good — even when PREYA looks more attractive. This is called "Viveka" — the power of good judgment! 🧠✨\n\nWhen you always choose SHREYA:\n✅ You become trustworthy\n✅ People respect you\n✅ You feel proud of yourself\n✅ Your future becomes bright and beautiful! 🌈`,
        example: "Telling the truth when it's hard to do so — that's choosing SHREYA! It might be uncomfortable, but it always makes things better! 💛",
        takeaway: "Choose what is good over what just feels good! Wise choices today create a brilliant tomorrow! 👍🌟",
        quiz: [
          {
            question: "What is 'SHREYA' in the Geeta? 🌟",
            options: ["Something that tastes sweet 🍭", "What is truly good for you even if hard 🌟", "The easiest choice 😴", "What makes you famous 🌟"],
            correct: 1,
          },
          {
            question: "What is 'PREYA'? 💔",
            options: ["A hard but good choice 💪", "What feels nice now but may harm later 💔", "A prayer 🙏", "A river in India 🌊"],
            correct: 1,
          },
          {
            question: "What is 'Viveka'? 🧠",
            options: ["A type of food 🍱", "A dance form 💃", "The power of good judgment 🧠", "A weapon ⚔️"],
            correct: 2,
          },
          {
            question: "Which is a SHREYA choice? ✅",
            options: ["Watching TV instead of homework 📺", "Eating only junk food 🍟", "Telling the truth even when it's hard 💛", "Taking your friend's toy 😤"],
            correct: 2,
          },
        ],
      },
      {
        id: "peace-and-happiness",
        title: "Peace & Happiness 😊",
        emoji: "😊",
        value: "Inner Peace & Contentment",
        story: `Here is the most beautiful secret in the whole Bhagavad Geeta — and when you understand it, it will change your life! 🌟\n\nMost people think: "I will be happy WHEN I get new toys, WHEN I become famous, WHEN everyone likes me…"\n\nBut Krishna says: "TRUE happiness lives INSIDE you — not outside!" 💛\n\nThe Sanskrit word for inner peace is "Shanti" 🕊️ — and it is always available to you, right now, in this moment!\n\nWhere does happiness come from?\n✅ Gratitude — being thankful for what you have\n✅ Kindness — giving happiness to others fills your own heart\n✅ Contentment (Santosh) — being okay with what you have right now\n✅ Connection to God — prayer and love for the divine\n\nKrishna's final message to Arjuna — and to all of us — is full of love:\n"I love you. I am always with you. Surrender your worries to me, do your best, and you will be at peace!" 🙏💛\n\nYou are never alone! God, your family, your teachers — they all walk beside you. And within you is a spark of the divine that is always peaceful, always happy, always free! ✨🕊️\n\nRemember: YOU ARE WONDERFUL! 🌟`,
        example: "Right now, think of THREE things you are grateful for — notice how you immediately feel a little happier? That's Shanti! 🕊️",
        takeaway: "True happiness is always inside you — choose gratitude, kindness, and love every day! Shanti! 🕊️😊",
        quiz: [
          {
            question: "What does 'Shanti' mean? 🕊️",
            options: ["Happiness from toys 🎮", "Inner peace 🕊️", "Being famous 🌟", "Winning a game 🏆"],
            correct: 1,
          },
          {
            question: "According to Krishna, where does TRUE happiness live? 💛",
            options: ["In expensive toys 🎮", "In being popular 🌟", "INSIDE you 💛", "In getting lots of prizes 🏆"],
            correct: 2,
          },
          {
            question: "What is 'Santosh'? 😊",
            options: ["Being greedy 🤑", "Always wanting more 😤", "Being content with what you have 😊", "Eating lots of sweets 🍬"],
            correct: 2,
          },
          {
            question: "What is one way to feel more peaceful right away? 🕊️",
            options: ["Buy more things 🛍️", "Get angry 😠", "Think of things you are grateful for 🙏", "Watch more TV 📺"],
            correct: 2,
          },
        ],
      },
    ],
  },
  {
    id: "ganesha-fun-wisdom",
    title: "Ganesha’s Fun Wisdom",
    emoji: "🐘",
    gradient: "from-amber-500 via-yellow-400 to-orange-300",
    cardBg: "bg-gradient-to-br from-amber-50 to-orange-50",
    accent: "bg-amber-500",
    textAccent: "text-amber-600",
    description: "Learn, laugh, and grow with Ganesha! 🐭 Build smart thinking, patience, kindness, and good habits through playful stories and mini quizzes.",
    badge: "Ganesha Genius",
    badgeEmoji: "🐘",
    character: "🐭",
    chapters: [
      {
        id: "who-is-ganesha",
        title: "Who is Ganesha? 🐘",
        emoji: "🐘",
        value: "Smart Thinking",
        story: `Lord Ganesha is the friendly elephant-headed God who is loved by children everywhere. He has a big heart, a calm mind, and a sweet smile.\n\nHis little mouse friend helps him travel anywhere. Ganesha is called the remover of obstacles, which means he helps us start new things with confidence.\n\nKids remember Ganesha because he is playful, wise, and always ready to bless good beginnings. When you pray to Ganesha before learning, you are asking for smart thoughts and a happy heart.`,
        example: "Before starting homework or a new game, take one calm breath like Ganesha and begin with confidence! 🤔",
        takeaway: "Ganesha teaches us to stay calm, think smart, and start with a smile! 🌟",
        quiz: [
          {
            question: "What kind of head does Ganesha have? 🐘",
            options: ["Lion 🦁", "Elephant 🐘", "Monkey 🐒", "Horse 🐴"],
            correct: 1,
          },
          {
            question: "Who is Ganesha's little friend? 🐭",
            options: ["Mouse 🐭", "Cat 🐱", "Dog 🐶", "Crow 🐦"],
            correct: 0,
          },
          {
            question: "What does Ganesha help us do? 🚧",
            options: ["Create obstacles", "Remove obstacles", "Forget homework", "Sleep all day"],
            correct: 1,
          },
          {
            question: "How should we start a new task? 😊",
            options: ["With a frown 😠", "With a calm smile 😊", "By giving up 😴", "By rushing fast 🏃"],
            correct: 1,
          },
        ],
      },
      {
        id: "think-before-you-act",
        title: "Think Before You Act 🧠",
        emoji: "🧠",
        value: "Smart Choices",
        story: `One day, young Ganesha was asked to guard the door. He did not rush. He looked, listened, and thought before acting.\n\nThat is his superpower! Ganesha teaches us that smart people pause first. They ask: "Is this a good choice? Will it help someone? Is it safe?"\n\nWhen you think first, you make fewer mistakes. You also become more trusted by parents and teachers. That is why thoughtful children shine bright!`,
        example: "If a toy breaks, think first before blaming someone. Smart thinking helps you choose the best words and actions. 🤔",
        takeaway: "Pause, think, and then act. Smart choices make happy days! 🌈",
        quiz: [
          {
            question: "What should you do before acting? 🤔",
            options: ["Think first", "Close your eyes and guess", "Run away", "Shout loudly"],
            correct: 0,
          },
          {
            question: "Why is thinking first helpful? 🧠",
            options: ["It creates more mistakes", "It helps make good choices", "It makes homework disappear", "It makes you sleepy"],
            correct: 1,
          },
          {
            question: "What question can smart kids ask? ❓",
            options: ["Will this help?", "Can I forget?", "Should I hide?", "Do I need to shout?"],
            correct: 0,
          },
          {
            question: "Ganesha teaches us to be… 🌟",
            options: ["Rushed", "Thoughtful", "Careless", "Lazy"],
            correct: 1,
          },
        ],
      },
      {
        id: "mahabharata-writing",
        title: "The Story of Mahabharata Writing ✍️",
        emoji: "✍️",
        value: "Focus & Teamwork",
        story: `The great sage Vyasa wanted someone special to write the Mahabharata. Ganesha agreed, but he had one condition: Vyasa must speak without stopping.\n\nGanesha wrote with amazing focus! When his pen broke, he did not get upset. He calmly broke one of his tusks and continued writing. That is incredible patience.\n\nThis story teaches us to keep going, stay focused, and complete important work with dedication. Ganesha shows us that learning can be both serious and joyful.`,
        example: "When you are writing a school answer, keep going carefully like Ganesha instead of stopping at the first difficulty. ✍️",
        takeaway: "Focus, patience, and dedication help you finish big tasks! 🎯",
        quiz: [
          {
            question: "Who asked Ganesha to write the Mahabharata? 📖",
            options: ["Vyasa", "Krishna", "Arjuna", "Rama"],
            correct: 0,
          },
          {
            question: "What did Ganesha do when his pen broke? 🖊️",
            options: ["Stopped forever", "Got angry", "Used his tusk", "Went to sleep"],
            correct: 2,
          },
          {
            question: "What lesson do we learn? 🌟",
            options: ["Give up quickly", "Stay focused and patient", "Never write", "Run away from work"],
            correct: 1,
          },
          {
            question: "Writing with dedication means… ✍️",
            options: ["Being careless", "Finishing with focus", "Ignoring the page", "Laughing only"],
            correct: 1,
          },
        ],
      },
      {
        id: "removing-obstacles",
        title: "Removing Obstacles 🚧",
        emoji: "🚧",
        value: "Bravery & Hope",
        story: `Ganesha is called Vighnaharta, the remover of obstacles. That means he helps clear the path when things feel hard.\n\nSometimes a child feels stuck: a puzzle is too tricky, a new school day feels scary, or a mistake feels big. Ganesha teaches us to breathe, ask for help, and try again.\n\nObstacles are not the end of the road. They are just bumps on the path. With courage, prayer, and effort, we can keep moving forward.`,
        example: "If your pencil breaks during class, take a deep breath, ask for another, and keep learning. That is obstacle-removing power! 🧡",
        takeaway: "Bumps on the road do not stop brave kids. Keep going! 🚀",
        quiz: [
          {
            question: "What does Vighnaharta mean? 🚧",
            options: ["Creator of obstacles", "Remover of obstacles", "King of mountains", "Friend of rain"],
            correct: 1,
          },
          {
            question: "What should you do when something is hard? 💪",
            options: ["Give up immediately", "Breathe and try again", "Cry forever", "Hide the problem"],
            correct: 1,
          },
          {
            question: "An obstacle is… 🚧",
            options: ["A tiny bump on the path", "The end of life", "A happy song", "A kind of fruit"],
            correct: 0,
          },
          {
            question: "Ganesha helps us feel… 🌈",
            options: ["Hopeless", "Brave", "Lazy", "Confused forever"],
            correct: 1,
          },
        ],
      },
      {
        id: "focus-patience",
        title: "Focus & Patience 🎯",
        emoji: "🎯",
        value: "Calm Effort",
        story: `Ganesha loves steady effort. He does not hurry. He listens carefully, moves kindly, and finishes what he starts.\n\nPatience means waiting with a calm heart. Focus means paying attention to one thing at a time. Together, they make a superpower!\n\nWhen kids practice focus and patience, reading becomes easier, drawing becomes prettier, and learning becomes fun. Great habits grow little by little.`,
        example: "If you are building blocks, place one block at a time. Calm and steady is the best way! 🧱",
        takeaway: "Slow and steady wins the learning race! 🐢✨",
        quiz: [
          {
            question: "What does patience mean? 😊",
            options: ["Waiting calmly", "Shouting faster", "Breaking things", "Sleeping all day"],
            correct: 0,
          },
          {
            question: "Focus means… 🎯",
            options: ["Doing many things at once", "Paying attention to one thing", "Ignoring work", "Running in circles"],
            correct: 1,
          },
          {
            question: "What is the best way to build blocks? 🧱",
            options: ["One at a time", "Throw them", "Never start", "Hide them"],
            correct: 0,
          },
          {
            question: "Ganesha teaches us to be… 🐘",
            options: ["Rushed", "Steady and calm", "Angry", "Careless"],
            correct: 1,
          },
        ],
      },
      {
        id: "respect-kindness",
        title: "Respect & Kindness 😊",
        emoji: "😊",
        value: "Good Habits",
        story: `Ganesha is gentle and loving. He respects his parents, listens carefully, and treats everyone with kindness.\n\nRespect means using good words, helping others, and following loving guidance. Kindness means making people feel safe and happy.\n\nWhen children show respect and kindness, their homes become peaceful and their hearts become bright. That is the secret of happy living!`,
        example: "Say thank you, help clean up, and listen the first time your parents speak. Those are Ganesha-style habits! 💛",
        takeaway: "Respect makes hearts soft. Kindness makes the world shine! ✨",
        quiz: [
          { question: "What should kids use with parents and teachers? 👂", options: ["Respectful words", "Loud noise", "Ignoring", "Arguing"], correct: 0 },
          { question: "Kindness means… 💛", options: ["Making others feel happy", "Taking things", "Saying mean words", "Leaving messes"], correct: 0 },
          { question: "Ganesha is known for being… 🐘", options: ["Rude", "Gentle and loving", "Lazy", "Mean"], correct: 1 },
          { question: "A respectful child… 🌟", options: ["Listens and helps", "Always shouts", "Never thanks anyone", "Breaks things"], correct: 0 },
        ],
      },
    ],
  },

  // ── FESTIVAL FUN QUESTS ────────────────────────────────────────────────────

  {
    id: "victory-quest-dussehra",
    title: "Victory Quest: Dussehra",
    emoji: "🏹",
    gradient: "from-red-500 via-orange-500 to-yellow-400",
    cardBg: "bg-gradient-to-br from-red-50 to-orange-50",
    accent: "bg-red-500",
    textAccent: "text-red-600",
    description: "Join Ram's greatest battle! 🏹 Learn how good always conquers evil, and why we celebrate Dussehra every year with joy!",
    badge: "Dharma Warrior",
    badgeEmoji: "🏹",
    character: "⚔️",
    chapters: [
      {
        id: "ram-vs-ravana",
        title: "Ram vs Ravana 😈",
        emoji: "😈",
        value: "Good vs Evil",
        story: `Long ago, the demon king Ravana ruled Lanka with ten heads and twenty arms. He was very powerful — but also very arrogant and cruel. He had kidnapped Sita, the beloved wife of the righteous prince Ram.\n\nRam assembled an amazing army of monkeys and bears, led by the mighty Hanuman. They crossed the ocean on a bridge of floating stones, each stone inscribed with Ram's name. 🪨✨\n\nOn the other side stood Lanka — golden, glittering, but filled with darkness. Ravana thought no one could defeat him. He had defeated gods and kings. He was arrogant and believed his power made him invincible.\n\nBut Ram was not just a warrior — he was Dharma itself. He stood for truth, justice, and love. And when goodness fights evil with a pure heart, goodness always wins! 🌟\n\nThe two armies stood on opposite sides of the battlefield. Ram's army had love and purpose. Ravana's army had only fear and greed. The battle was about to begin!`,
        example: "In school or at home, when you see someone being unfair or unkind, choose to be like Ram — stand up for what's right! 💪",
        takeaway: "True power comes from goodness, not from strength alone. Dharma always wins! 🏹",
        quiz: [
          { question: "Why did Ram fight Ravana? ⚔️", options: ["To become king of Lanka 👑", "To rescue Sita 💛", "To prove his strength 💪", "To win treasure 💰"], correct: 1 },
          { question: "What was special about the stones in Ram's bridge? 🪨", options: ["They were made of gold 🌟", "They had 'Ram' written on them 🪨", "They were magical gems 💎", "They were very light 🪶"], correct: 1 },
          { question: "Why was Ravana powerful but still wrong? 😈", options: ["He had no army ⚔️", "He stole and was cruel 😈", "He was too old 👴", "He had no weapons 🗡️"], correct: 1 },
          { question: "What does Dharma mean? 🌟", options: ["Money and power 💰", "Doing what is right and just 🌟", "Running away from problems 🏃", "Ignoring others 😶"], correct: 1 },
        ],
      },
      {
        id: "the-great-battle",
        title: "The Great Battle ⚔️",
        emoji: "⚔️",
        value: "Courage & Perseverance",
        story: `The battle of Lanka was fierce and lasted many days! Heroes on both sides fought with incredible courage. Hanuman burned Lanka with his flaming tail. Lakshman fought bravely. The monkey warriors proved that even the small and humble can be heroes! 🐒🔥\n\nRavana kept regenerating! Every time Ram cut off a head, a new one grew back. It seemed impossible to defeat him.\n\nBut then something wonderful happened. The wise sage Agastya appeared from the sky and taught Ram a secret prayer — the Aditya Hridayam — a hymn to the Sun God who destroys all darkness and evil. ☀️\n\nRam prayed with full faith and concentration. Then he took his most powerful divine arrow — the Brahmastra — and aimed it with perfect focus at Ravana's chest, where the nectar of immortality was hidden in his navel.\n\nWith a sound like thunder, the arrow flew! 💥 It struck true. Ravana fell. The demon king was defeated.\n\nThe sky rained flowers. Gods cheered from the heavens. Sita was finally free! 🌸🎊`,
        example: "When a problem seems impossible, don't give up! Like Ram, keep trying, stay focused, and use your best effort! 🎯",
        takeaway: "True courage is facing hard problems without giving up. Faith and focus make the impossible possible! ⚔️",
        quiz: [
          { question: "What did sage Agastya teach Ram? 📖", options: ["How to use a sword ⚔️", "The Aditya Hridayam prayer ☀️", "How to fly 🦅", "A magic spell 🪄"], correct: 1 },
          { question: "Where was Ravana's immortality hidden? ✨", options: ["In his ten heads 😤", "In his navel 🎯", "In his crown 👑", "In his sword ⚔️"], correct: 1 },
          { question: "Who proved that small heroes can be brave? 🐒", options: ["Ravana 😈", "The monkey warriors 🐒", "Ravana's sons 👹", "The sea 🌊"], correct: 1 },
          { question: "What happened in the sky after Ravana was defeated? 🌸", options: ["It rained heavily 🌧️", "Flowers rained from the sky 🌸", "Darkness spread 🌑", "Lightning struck ⚡"], correct: 1 },
        ],
      },
      {
        id: "lessons-of-courage",
        title: "Lessons of Courage 🌟",
        emoji: "🌟",
        value: "Victory & Celebration",
        story: `After the battle, the world celebrated! And that celebration became the festival we love — DUSSEHRA! 🎉🏹\n\nEvery year during Dussehra, we burn giant effigies of Ravana, Meghnath (his son), and Kumbhkaran (his brother). BOOM! 💥 The fireworks light up the night sky, and everyone cheers!\n\nBut Dussehra is much more than fireworks. It is a reminder of three powerful lessons:\n\n🌟 Lesson 1: Good ALWAYS wins over evil — no matter how long it takes!\n\n💪 Lesson 2: Evil comes in many forms — it can be anger, jealousy, greed, or lies inside us too. Dussehra reminds us to burn away OUR bad habits just like we burn the effigies!\n\n🙏 Lesson 3: When you stand for truth with a pure heart, the whole universe helps you — just like the gods helped Ram!\n\nSo every Dussehra, as you watch Ravana burn, think: "Which bad habit will I conquer today?" That is the REAL victory! ✨`,
        example: "Your 'Ravana' could be laziness, dishonesty, or anger. Dussehra is the perfect day to decide to defeat it! 💪",
        takeaway: "Dussehra teaches us that the real battle is inside us — conquer your bad habits and you will always win! 🌟🏹",
        quiz: [
          { question: "What do we burn on Dussehra? 🔥", options: ["Old books 📚", "Effigies of Ravana and his family 🔥", "Lamps 🪔", "Paper boats ⛵"], correct: 1 },
          { question: "What is the REAL lesson of Dussehra? 💪", options: ["To eat sweets 🍬", "To defeat our own bad habits 💪", "To take a holiday 🏖️", "To get gifts 🎁"], correct: 1 },
          { question: "What helped Ram win — his heart was full of…? 💛", options: ["Anger and revenge 😡", "Truth and love 💛", "Wealth and gold 💰", "Fear of Ravana 😰"], correct: 1 },
          { question: "What is Dussehra a reminder of? 🌟", options: ["Good always wins over evil 🌟", "A king's birthday 🎂", "A new year 🎆", "A rain festival 🌧️"], correct: 0 },
        ],
      },
    ],
  },

  {
    id: "diwali-adventure",
    title: "Festival of Lights: Diwali",
    emoji: "🪔",
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    cardBg: "bg-gradient-to-br from-yellow-50 to-amber-50",
    accent: "bg-yellow-500",
    textAccent: "text-yellow-600",
    description: "Discover why we light diyas and celebrate Diwali! 🪔 It's the most joyful festival of lights, love, and happiness!",
    badge: "Light Bringer",
    badgeEmoji: "🪔",
    character: "✨",
    chapters: [
      {
        id: "return-of-ram-diwali",
        title: "Return of Ram 🏰",
        emoji: "🏰",
        value: "Gratitude & Joy",
        story: `After 14 long years in the forest and the great battle with Ravana, Ram, Sita, and Lakshman finally returned home to Ayodhya! 🎉\n\nThey flew in Ravana's magical flying chariot called Pushpaka Vimana — a palace in the sky that could carry thousands of people! ✈️☁️\n\nAs they descended toward Ayodhya, the people could not contain their joy. The whole kingdom had missed their beloved prince for 14 years. Women wept with happiness, children danced in the streets, and even the flowers bloomed brighter that day! 🌸\n\nBut there was a problem — Ram was returning on the night of Amavasya, the darkest night of the month! The moon had disappeared and the roads were pitch black. How would Ram find his way?\n\nThe people of Ayodhya had a beautiful idea: they lit tiny clay oil lamps — diyas — and placed them along every road, on every rooftop, in every window, and before every door. 🪔🪔🪔\n\nSuddenly, the darkness vanished! Ayodhya shone brighter than the stars! And from the sky, Ram looked down and saw his kingdom glowing like a jewel. He knew he was home! ❤️`,
        example: "When someone you love returns after a long time, how do you welcome them? The people of Ayodhya showed us — with light, love, and joy! 🪔",
        takeaway: "Light always conquers darkness. Celebrate the return of goodness with joy! 🏰🌟",
        quiz: [
          { question: "What was the name of Ram's flying chariot? ✈️", options: ["Garuda Vimana 🦅", "Pushpaka Vimana ✈️", "Surya Vimana ☀️", "Chandra Vimana 🌙"], correct: 1 },
          { question: "Why was it dark when Ram returned to Ayodhya? 🌑", options: ["There was a storm 🌧️", "It was the night of Amavasya (no moon) 🌑", "The sun had set early ☀️", "They arrived very late 🕛"], correct: 1 },
          { question: "How did people welcome Ram? 🪔", options: ["With fireworks only 🎆", "With oil lamp diyas 🪔", "With a big feast 🍽️", "With garlands 🌸"], correct: 1 },
          { question: "After how many years did Ram return? 🔢", options: ["7 years", "10 years", "12 years", "14 years"], correct: 3 },
        ],
      },
      {
        id: "diyas-and-celebration",
        title: "Diyas & Celebration 🎆",
        emoji: "🎆",
        value: "Light, Joy & Sharing",
        story: `Diwali is a five-day festival full of fun and love! Let's learn what each day means! 🌟\n\n🌑 Day 1 — Dhanteras: We clean our homes and buy new things. This day honors Goddess Lakshmi and Lord Dhanvantari (the doctor of gods!). Buying gold or silver brings good luck! 💰\n\n🌒 Day 2 — Choti Diwali: We start lighting diyas and cleaning ourselves too! In many stories, Lord Krishna defeated the demon Narakasura on this day, freeing 16,000 people! 🏹\n\n🌕 Day 3 — Diwali Main: The biggest night! 🎉 Homes glow with thousands of diyas, rangoli patterns decorate doorsteps, sweets are shared with everyone, and the sky explodes with colorful fireworks! 🎇✨\n\n🌘 Day 4 — Govardhan Puja: We thank God for protecting us, just like Krishna lifted Govardhan mountain to protect the villagers from a storm! ⛰️\n\n🌑 Day 5 — Bhai Dooj: Brothers and sisters celebrate their bond of love! Sisters pray for their brothers' safety and brothers promise to protect their sisters! 🥰\n\nEvery lamp on Diwali says: "Darkness cannot last. Light will always return!" 🪔`,
        example: "On Diwali, share sweets with neighbors, help decorate diyas, and make a beautiful rangoli. Sharing is the real celebration! 🎁",
        takeaway: "Diwali teaches us that light, love, and sharing make life beautiful! Every diya we light spreads happiness! 🎆",
        quiz: [
          { question: "How many days does Diwali celebration last? 🕯️", options: ["2 days", "3 days", "5 days", "7 days"], correct: 2 },
          { question: "What do we celebrate on Dhanteras? 💰", options: ["Lord Shiva's birthday 🙏", "Goddess Lakshmi and cleanliness 💰", "The harvest 🌾", "Ram's wedding 💛"], correct: 1 },
          { question: "What is Bhai Dooj about? 🥰", options: ["Friends celebrating 🤝", "Brothers and sisters' love 🥰", "Teachers and students 📚", "Parents and children 👨‍👧"], correct: 1 },
          { question: "What does every lit diya on Diwali say? 🪔", options: ["Stay in darkness 🌑", "Light conquers darkness 🪔", "Only fire is powerful 🔥", "Sweets are important 🍬"], correct: 1 },
        ],
      },
      {
        id: "lakshmi-puja",
        title: "Lakshmi Puja 🌸",
        emoji: "🌸",
        value: "Gratitude & Prosperity",
        story: `On the main night of Diwali, we welcome Goddess Lakshmi — the beautiful goddess of wealth, love, and well-being! 🌸✨\n\nLakshmi is not just about money. She brings:\n💰 Dhana Lakshmi — abundance and wealth\n🌾 Dhanya Lakshmi — health and food\n📚 Vidya Lakshmi — knowledge and wisdom\n💪 Veera Lakshmi — courage and strength\n❤️ Santana Lakshmi — love and family\n🏆 Vijaya Lakshmi — victory and success\n🌊 Gaja Lakshmi — power and prosperity\n🙏 Adi Lakshmi — divine grace\n\nThat means TRUE wealth is not just money — it is good health, wisdom, courage, love, and success!\n\nOn Diwali night, families clean every corner of the house (Lakshmi loves clean, bright places!) 🧹, draw beautiful rangoli at the entrance 🎨, light diyas in every room, and perform puja with flowers, sweets, and prayers. 🙏\n\nThen families sit together, share sweets, exchange gifts, and thank God for everything they have. The light inside our hearts — gratitude — is the most beautiful diya of all! 🪔💛`,
        example: "This Diwali, write a list of 10 things you are grateful for. Gratitude is the best wealth! 📝💛",
        takeaway: "True wealth is gratitude, love, knowledge, and health. Lakshmi blesses those with pure and grateful hearts! 🌸🪔",
        quiz: [
          { question: "Which goddess do we welcome on Diwali night? 🌸", options: ["Saraswati 📚", "Durga 💪", "Lakshmi 🌸", "Parvati 🏔️"], correct: 2 },
          { question: "Lakshmi brings how many types of wealth? 🔢", options: ["3 types", "5 types", "7 types", "8 types"], correct: 3 },
          { question: "Why do we clean our homes before Diwali? 🧹", options: ["For exercise 💪", "Because Lakshmi loves clean bright places 🧹", "To find lost things 🔍", "Because it's a rule 📋"], correct: 1 },
          { question: "What is the most beautiful 'diya' we can light? 💛", options: ["A gold diya 🥇", "An oil diya 🪔", "Gratitude in our hearts 💛", "A candle 🕯️"], correct: 2 },
        ],
      },
    ],
  },

  {
    id: "navratri-power-quest",
    title: "Navratri Power Quest",
    emoji: "💃",
    gradient: "from-pink-500 via-fuchsia-500 to-purple-600",
    cardBg: "bg-gradient-to-br from-pink-50 to-purple-50",
    accent: "bg-pink-500",
    textAccent: "text-pink-600",
    description: "Celebrate Maa Durga's power! 💃 9 nights of dance, devotion, and the story of how Goddess Durga defeated the demon Mahishasura!",
    badge: "Durga Devotee",
    badgeEmoji: "🌺",
    character: "🔱",
    chapters: [
      {
        id: "story-of-durga",
        title: "Story of Durga 🔱",
        emoji: "🔱",
        value: "Strength & Courage",
        story: `Long ago, a powerful buffalo-demon named Mahishasura terrorized the three worlds. He had a powerful boon: no man or god could defeat him! He chased the gods out of heaven and declared himself king of the universe. 😤\n\nThe gods were desperate. They gathered together and prayed with all their love and energy. From their combined divine light, a blazing, golden form began to emerge — GODDESS DURGA! 🌟\n\nDurga was magnificent. She had 8 arms, each holding a different weapon gifted by the gods:\n🌊 Lord Varuna gave her a conch shell\n🔱 Lord Shiva gave her a trident\n💥 Lord Vishnu gave her a spinning disc (Sudarshana Chakra)\n🌙 Chandra gave her a bow and arrows\n⚡ Lord Indra gave her his thunderbolt\n\nRiding a magnificent lion 🦁, Durga went to battle. The demon laughed — a woman? Against him? But Durga did not shake. She fought with divine grace, power, and focus.\n\nAfter 9 days and 9 nights of fierce battle, Durga defeated Mahishasura! The universe celebrated! This 9-day celebration is NAVRATRI! 💃🎊`,
        example: "Just like Durga never gave up no matter how scary the demon seemed, you should never give up on hard problems! 💪",
        takeaway: "True strength is calm, focused, and never gives up. Maa Durga shows us that courage has no limits! 🔱",
        quiz: [
          { question: "Why couldn't the gods defeat Mahishasura? 😤", options: ["He was invisible 👻", "He had a boon — no man or god could defeat him 😤", "He hid underground 🌍", "He was too fast 💨"], correct: 1 },
          { question: "How many arms does Goddess Durga have? 🌟", options: ["4 arms", "6 arms", "8 arms", "10 arms"], correct: 2 },
          { question: "What animal does Durga ride? 🦁", options: ["Elephant 🐘", "Horse 🐴", "Lion 🦁", "Tiger 🐯"], correct: 2 },
          { question: "How long did Durga's battle with Mahishasura last? ⚔️", options: ["1 day", "3 days and 3 nights", "9 days and 9 nights", "1 month"], correct: 2 },
        ],
      },
      {
        id: "nine-forms-navratri",
        title: "Nine Forms of Durga 🌺",
        emoji: "🌺",
        value: "Wisdom & Devotion",
        story: `During the 9 days of Navratri, we honor 9 different forms of Maa Durga — called the Navadurga. Each form has special powers and lessons for us! 🌟\n\n1️⃣ Shailputri — Daughter of the Himalayas 🏔️ — teaches stability and groundedness\n2️⃣ Brahmacharini — The devoted seeker 🙏 — teaches discipline and focus\n3️⃣ Chandraghanta — Bell of the moon 🌙 — teaches courage and bravery\n4️⃣ Kushmanda — The cosmic creator 🌍 — teaches creativity and energy\n5️⃣ Skandamata — Mother of Skanda 👶 — teaches selfless love and care\n6️⃣ Katyayani — The fierce warrior ⚔️ — teaches justice and strength\n7️⃣ Kalaratri — Destroyer of darkness 🌑 — teaches fearlessness\n8️⃣ Mahagauri — Pure and radiant ⚪ — teaches peace and forgiveness\n9️⃣ Siddhidatri — Giver of wisdom 📖 — teaches knowledge and enlightenment\n\nEach form of Durga represents a quality we can develop in ourselves! When we worship Durga, we are also praying to become strong, wise, loving, and brave — just like her! 🌺`,
        example: "Which form of Durga do you want to be like? Pick one quality — courage, focus, love, or wisdom — and practice it this week! 💪",
        takeaway: "Goddess Durga has 9 forms, each teaching us a different superpower! Navratri is the time to grow our inner strength! 🌺",
        quiz: [
          { question: "How many forms of Durga do we worship during Navratri? 🔢", options: ["3 forms", "6 forms", "9 forms", "12 forms"], correct: 2 },
          { question: "Shailputri is the daughter of…? 🏔️", options: ["The ocean 🌊", "The Himalayas 🏔️", "The clouds ☁️", "The forest 🌳"], correct: 1 },
          { question: "Which form of Durga teaches fearlessness? 🌑", options: ["Brahmacharini 🙏", "Kushmanda 🌍", "Kalaratri 🌑", "Mahagauri ⚪"], correct: 2 },
          { question: "When we worship Durga's 9 forms, we are really praying to become…? 💪", options: ["Rich and famous 💰", "Strong, wise, loving, and brave 💪", "Tall and beautiful 💅", "Lazy and comfortable 😴"], correct: 1 },
        ],
      },
      {
        id: "garba-celebration",
        title: "Garba & Celebration 🎶",
        emoji: "🎶",
        value: "Joy, Community & Culture",
        story: `Navratri is the most colorful and joyful festival of dance! Every night for 9 nights, people dress in beautiful traditional clothes and dance the GARBA and DANDIYA RAAS! 💃🕺\n\nGarba is a circular dance where everyone moves together, clapping and spinning, their colorful clothes swirling like flowers! The word "Garba" comes from the Sanskrit "Garbha Deep" — a lamp inside a pot with holes — symbolizing the divine light inside every being! 🪔\n\nDandiya Raas is played with decorated sticks. The rhythmic click-clack of sticks, the swirling colors, and the joyful music create a magical night! The beats represent the battle dance of Durga defeating Mahishasura! ⚔️💃\n\nWhat makes Navratri special is that EVERYONE dances together — old and young, rich and poor. It reminds us that we are all part of one big community, one big family! 👨‍👩‍👧‍👦\n\nThe traditional colors worn each day are also meaningful — red for strength, blue for peace, yellow for happiness, green for growth, orange for courage, white for peace, pink for hope, purple for ambition, and sky blue for joy! 🌈\n\nNavratri teaches us: celebrate life, stay connected to culture, and keep the divine spark dancing inside you! 🌟`,
        example: "Ask a family member to teach you a simple Garba step this Navratri! Dancing together creates beautiful memories! 💃",
        takeaway: "Garba celebrates our unity, our culture, and the divine light inside every one of us! Dance with joy! 🎶🌺",
        quiz: [
          { question: "What does 'Garba' come from in Sanskrit? 🪔", options: ["A type of food 🍱", "Garbha Deep — a lit lamp in a pot 🪔", "A warrior's dance ⚔️", "A mountain 🏔️"], correct: 1 },
          { question: "What does Dandiya Raas represent? ⚔️", options: ["A farming dance 🌾", "The battle dance of Durga 💃⚔️", "A rain ceremony 🌧️", "A wedding celebration 💍"], correct: 1 },
          { question: "What is special about Navratri dancing? 👨‍👩‍👧‍👦", options: ["Only women dance 💃", "Only priests can dance 🙏", "Everyone dances together — old, young, rich, poor 👨‍👩‍👧‍👦", "Only children can dance 👶"], correct: 2 },
          { question: "The red color worn during Navratri represents…? 💪", options: ["Happiness 😊", "Strength and power 💪", "Peace and calm 😌", "Wealth 💰"], correct: 1 },
        ],
      },
    ],
  },

  {
    id: "holi-fun-quest",
    title: "Color Blast: The Holi Fun Quest",
    emoji: "🎨",
    gradient: "from-pink-400 via-purple-400 to-blue-500",
    cardBg: "bg-gradient-to-br from-pink-50 to-blue-50",
    accent: "bg-pink-500",
    textAccent: "text-pink-600",
    description: "Get ready for the most colorful festival! 🎨 Learn the amazing story behind Holi and why we celebrate with colors, joy, and love!",
    badge: "Color Champion",
    badgeEmoji: "🎨",
    character: "🌈",
    chapters: [
      {
        id: "prahlad-story",
        title: "Prahlad's Story 🙏",
        emoji: "🙏",
        value: "Devotion & Faith",
        story: `The story of Holi begins with a little boy named Prahlad — one of the bravest devotees of Lord Vishnu! 🌟\n\nPrahlad's father was King Hiranyakashipu — a terrible demon king who believed he was the most powerful being in the universe. He had received a special boon: he could not be killed by man or animal, inside or outside, by day or night, on earth or in sky, by any weapon! He commanded everyone to worship HIM — not God!\n\nBut little Prahlad refused! With gentle eyes and a pure heart, the young boy said: "God is everywhere. I can only worship the one true Lord Vishnu!" 🙏\n\nHiranyakashipu was furious. He tried to kill his own son many times:\n🐘 He threw Prahlad in front of elephants — but Prahlad chanted Lord Vishnu's name and was unharmed!\n🐍 He threw Prahlad into a pit of snakes — but they would not hurt him!\n🔥 He poisoned him, pushed him off cliffs, threw him in fires — but Prahlad's devotion protected him every time!\n\nPrahlad never stopped smiling and chanting. His faith was stronger than any demon's power! 🌟\n\nThis story teaches us: when your heart is pure and you believe in what is right, no force can truly harm you!`,
        example: "Have you ever stood up for what's right even when it was scary? That's Prahlad's courage — and it lives in you too! 💪",
        takeaway: "True faith and devotion protect us. Never give up on what you believe is right, no matter what! 🙏",
        quiz: [
          { question: "Who was Prahlad's father? 😈", options: ["Lord Vishnu 🌟", "King Hiranyakashipu 😈", "Lord Shiva 🔱", "King Dashrath 👑"], correct: 1 },
          { question: "What did Hiranyakashipu command everyone to do? 😤", options: ["Worship Lord Vishnu 🙏", "Worship HIM instead of God 😤", "Stop all festivals 🚫", "Build bigger temples 🛕"], correct: 1 },
          { question: "What did Prahlad do when thrown in fires and pits? 🙏", options: ["He cried and begged 😢", "He chanted Lord Vishnu's name and stayed unharmed 🙏", "He fought back ⚔️", "He ran away 🏃"], correct: 1 },
          { question: "What does Prahlad's story teach us? 🌟", options: ["Be scary and powerful 💪", "Pure faith is stronger than any force 🌟", "Never trust anyone 😤", "Power wins everything 👑"], correct: 1 },
        ],
      },
      {
        id: "holika-dahan",
        title: "Holika Dahan 🔥",
        emoji: "🔥",
        value: "Truth Always Wins",
        story: `Hiranyakashipu had a sister named Holika. She had a magical fireproof cloak — a special garment that could protect her from any fire! 🔥\n\nHiranyakashipu had an evil plan. He ordered Holika to sit in a huge bonfire with little Prahlad on her lap! "My fireproof cloak will protect me," said Holika, "and the boy will burn!" 😈\n\nThe bonfire was lit. People watched in horror. Prahlad closed his eyes and chanted Lord Vishnu's name with all his heart: "Narayan... Narayan... Narayan..." 🙏\n\nThen something MIRACULOUS happened! 🌟\n\nThe magical cloak flew off Holika and covered Prahlad instead! Holika, who used her power for evil, burned away. But Prahlad, protected by his pure devotion, walked out of the fire unharmed and smiling!\n\nThe people cheered! Good had defeated evil once again!\n\nThat night became HOLIKA DAHAN — the burning of Holika. Every year, on the night before Holi, we light bonfires to celebrate the victory of truth over evil, of goodness over cruelty! 🔥🌟\n\nThe fire reminds us: burn away your bad habits, your jealousy, your anger — and step out pure and smiling like Prahlad! 🌺`,
        example: "If someone tries to make you do something wrong, be like Prahlad — say no gently but firmly, and trust in doing what's right! 💪",
        takeaway: "When you use power to harm others, it comes back to hurt you. Truth and goodness always protect the innocent! 🔥🌟",
        quiz: [
          { question: "Who was Holika? 🔥", options: ["Prahlad's mother 💕", "Hiranyakashipu's sister 🔥", "A goddess 🌸", "A demon queen 😈"], correct: 1 },
          { question: "What was special about Holika's cloak? 🧥", options: ["It was made of gold 🥇", "It was fireproof — fire couldn't burn it 🧥", "It made her invisible 👻", "It was very soft 🌸"], correct: 1 },
          { question: "What happened to Holika's magic cloak in the fire? 🌟", options: ["It got bigger 📏", "It burned first 🔥", "It flew off and covered Prahlad 🌟", "It disappeared 🌫️"], correct: 2 },
          { question: "What does Holika Dahan teach us? 🌟", options: ["Fire is dangerous 🔥", "Truth and goodness always win 🌟", "Magic cloaks are useful 🧥", "Demons are powerful 😈"], correct: 1 },
        ],
      },
      {
        id: "festival-of-colors",
        title: "Festival of Colors 🌈",
        emoji: "🌈",
        value: "Joy, Unity & Positivity",
        story: `The morning after Holika Dahan, the real magic begins — HOLI! 🎨🌈\n\nEveryone comes outside with packets of colorful powder (called "gulal") and water guns (pichkaris)! Yellow, pink, green, blue, purple — colors fly EVERYWHERE! 🌈💦\n\nHoli is also connected to Lord Krishna's playful love! As a young boy in Vrindavan, Krishna noticed that his beloved Radha had a beautiful fair complexion while he was dark blue (from the blessing/curse of the serpent Kaliya). Young Krishna teased his mother: "Why is Radha so fair and I am dark?" \n\nHis mother smiled and said: "Go! Color her face any color you like!" 💛\n\nSo Krishna ran to Radha and playfully put color on her face, and Radha colored Krishna back, and soon all the friends were playing with colors! That joyful play became the tradition of Holi! 🦚💕\n\nHoli teaches us:\n🌈 All colors are beautiful — just like all people are beautiful!\n💕 Joy is found in play, love, and togetherness!\n🌟 Forgive past differences and start fresh — Holi is a time for new beginnings!\n🙏 Even Lord Krishna celebrated joy — happiness is divine!\n\nSo this Holi, throw colors with love — and remember, the most beautiful color is the kindness in your heart! 💛`,
        example: "This Holi, give a hug to someone you haven't spoken to in a while. Forgiveness is the best color of all! 🌈💕",
        takeaway: "Holi celebrates joy, unity, love, and new beginnings. Life is more beautiful when shared with colors and kindness! 🎨",
        quiz: [
          { question: "What is 'gulal'? 🎨", options: ["A type of sweet 🍬", "Colorful powder used in Holi 🎨", "A water gun 💦", "A dance 💃"], correct: 1 },
          { question: "Which young Lord started the tradition of playing with colors? 🦚", options: ["Ram 🏹", "Ganesha 🐘", "Krishna 🦚", "Hanuman 🐒"], correct: 2 },
          { question: "Why did Krishna put color on Radha's face? 💛", options: ["To scare her 😱", "Because he was angry 😤", "In playful love and fun 💛", "As a punishment 😤"], correct: 2 },
          { question: "What does Holi remind us to do? 🌈", options: ["Stay indoors 🏠", "Forgive, have joy, and start fresh 🌈", "Be quiet and serious 😶", "Avoid everyone 😤"], correct: 1 },
        ],
      },
    ],
  },

  {
    id: "rakhi-bond-quest",
    title: "Bond of Love: Rakhi Quest",
    emoji: "🎁",
    gradient: "from-rose-400 via-red-400 to-pink-500",
    cardBg: "bg-gradient-to-br from-rose-50 to-pink-50",
    accent: "bg-rose-500",
    textAccent: "text-rose-600",
    description: "Celebrate the most beautiful bond of love! 🎁 Discover the stories and meaning behind Raksha Bandhan — the festival of brothers and sisters!",
    badge: "Bond Guardian",
    badgeEmoji: "🎁",
    character: "🪡",
    chapters: [
      {
        id: "meaning-of-rakhi",
        title: "Meaning of Rakhi 💕",
        emoji: "💕",
        value: "Love & Protection",
        story: `"Raksha" means protection. "Bandhan" means bond. So Raksha Bandhan means "the bond of protection" — and it is one of the most loving festivals in Hindu tradition! 💕\n\nOn this special day, a sister ties a beautiful thread called Rakhi on her brother's wrist. This thread is not just cotton and silk — it is woven with prayers, love, and trust! 🪡\n\nThe sister prays: "May my brother always be protected, healthy, and happy. May he live a long and wonderful life!" 🙏\n\nThe brother promises: "I will always protect my sister, care for her, and stand by her side!" ❤️\n\nThe Rakhi thread is a symbol of this sacred promise. Even kings bowed to its power! History tells us that when Queen Karnawati of Chittor was in danger, she sent a Rakhi to the Mughal Emperor Humayun. He accepted it as his sister's thread and came to protect her kingdom — because the bond of Rakhi was so deeply respected! 🌟\n\nRaksha Bandhan is not just for siblings. It represents any bond of love and protection — between friends, cousins, even between a student and teacher! The thread connects hearts across any distance! 💕`,
        example: "Does your brother or sister do something kind for you? This Rakhi, tell them: 'Thank you for always being there!' 💕",
        takeaway: "Rakha Bandhan teaches us that the strongest bonds are not made of gold but of love, trust, and care! 💕🪡",
        quiz: [
          { question: "What does 'Raksha Bandhan' mean? 💕", options: ["Festival of lights 🪔", "Bond of protection 💕", "Festival of colors 🎨", "Harvest celebration 🌾"], correct: 1 },
          { question: "Who ties the Rakhi thread? 🪡", options: ["Parents 👨‍👩", "Brother 👦", "Sister 👧", "Teacher 📚"], correct: 2 },
          { question: "What does the brother promise on Raksha Bandhan? ❤️", options: ["To buy expensive gifts 🎁", "To protect and care for his sister ❤️", "To win a competition 🏆", "To travel far away ✈️"], correct: 1 },
          { question: "Emperor Humayun responded to a Rakhi from Queen Karnawati by…? 🌟", options: ["Ignoring it 😤", "Sending gifts 🎁", "Coming to protect her kingdom 🌟", "Starting a war ⚔️"], correct: 2 },
        ],
      },
      {
        id: "stories-of-bond",
        title: "Stories of Bond 🌟",
        emoji: "🌟",
        value: "Faith, Loyalty & Gratitude",
        story: `The Rakhi bond appears in many beautiful stories from our tradition! Let's discover some! 🌟\n\n🔱 Krishna & Draupadi: Once, Lord Krishna cut his finger while cutting sugarcane. Draupadi — who was like a sister to him — immediately tore a strip from her beautiful sari and tied it around his wound. Touched by her love, Krishna promised: "Whenever you need me, I will be there!" Years later, when Draupadi was humiliated at the Kauravas' court, Krishna came to her aid — fulfilling his promise! The bond of love repays love! 💕\n\n🌊 Indra & Sachi: In the heavens, when the gods were about to face a terrible demon in battle, Goddess Sachi (Indra's wife) tied a sacred thread on Lord Indra's wrist. With this thread's protection and her prayers, Indra went to battle and was victorious! 🏆\n\n🐚 Yama & Yamuna: Lord Yama (god of death) and his sister Yamuna (the river goddess) have a special bond. Their reunion gave rise to Bhai Dooj — the sister-brother festival after Diwali! 🌊\n\nThese stories show us: the bond of love and care between siblings and close friends is sacred, powerful, and everlasting! In our tradition, this bond is honored and protected forever! 🌟`,
        example: "Think of one person who always has your back — a sibling, cousin, or friend. Write them a note saying how much their support means to you! 💕",
        takeaway: "The stories of Rakhi show that love and loyalty create bonds stronger than anything in the universe! 🌟",
        quiz: [
          { question: "What did Draupadi do when Krishna cut his finger? 💕", options: ["She cried 😢", "She tore her sari and tied it as a bandage 💕", "She ran away 🏃", "She called a doctor 👨‍⚕️"], correct: 1 },
          { question: "What did Krishna promise Draupadi when she tied the cloth? 🌟", options: ["He'd buy her gifts 🎁", "He'd be there whenever she needed him 🌟", "He'd never see her again 😤", "He'd fight everyone ⚔️"], correct: 1 },
          { question: "What is Bhai Dooj related to? 🌊", options: ["Lord Ganesha 🐘", "The bond between Yama and Yamuna 🌊", "Lord Vishnu 🌟", "The Pandavas ⚔️"], correct: 1 },
          { question: "What do these stories teach about sibling bonds? 💕", options: ["Siblings always fight 😤", "Bonds of love are sacred and powerful 💕", "Siblings grow apart always 😢", "Only money connects people 💰"], correct: 1 },
        ],
      },
      {
        id: "celebrating-together",
        title: "Celebrating Together 🎀",
        emoji: "🎀",
        value: "Family & Community Love",
        story: `Raksha Bandhan is one of the most joyful family occasions! Every family celebrates it in their own beautiful way — but the love is always the same! 💕\n\nOn the day of Raksha Bandhan:\n\n🌅 Morning: Sisters wake up early, take a bath, wear new clothes, and prepare the puja thali — a beautiful plate with:\n🪡 The Rakhi thread\n🔴 Roli (red vermilion powder)\n🌾 Akshat (sacred rice grains)\n🪔 A lit diya\n🍬 Sweets (mithai)\n\n🙏 The Ritual: The sister performs aarti (circular prayer with the lamp) for her brother's long life. Then she puts a tikka (red dot) on his forehead, ties the Rakhi on his wrist, feeds him sweets, and prays for his health and happiness! ❤️\n\n🎁 Brother's Gift: The brother gives a gift to his sister — but the most important "gift" is his promise to always protect and care for her!\n\n👨‍👩‍👧‍👦 Family Feast: After the ceremony, the whole family sits together, eats special food, shares memories, and celebrates their love!\n\nNo matter how far apart siblings live — in different cities or different countries — Rakhi is the thread that keeps hearts connected forever! 🪡💕\n\nRemember: You don't need to be related by blood to celebrate this bond. Any close, caring relationship is worth honoring with love! 🌟`,
        example: "Help your sister (or a close friend) put together a Rakhi puja thali this year. The preparation is part of the celebration! 🎀",
        takeaway: "Raksha Bandhan reminds us: family bonds are sacred. Celebrate love, make promises, and keep them always! 🎀💕",
        quiz: [
          { question: "What is a 'puja thali'? 🪡", options: ["A type of food 🍱", "A plate with Rakhi, sweets, and prayer items 🪡", "A special dance 💃", "A type of diya 🪔"], correct: 1 },
          { question: "What is the most important 'gift' a brother gives on Raksha Bandhan? 🌟", options: ["Gold jewelry 💍", "His promise to protect and care for his sister 🌟", "Expensive clothes 👗", "Money 💰"], correct: 1 },
          { question: "Can Raksha Bandhan be celebrated with close friends, not just siblings? 💕", options: ["No, only between blood siblings 😤", "Yes! Any caring bond can be honored 💕", "Only adults can celebrate 👴", "Only girls celebrate it 👧"], correct: 1 },
          { question: "What keeps sibling hearts connected even across great distances? 🪡", options: ["Phones and messages 📱", "The Rakhi thread and the love it represents 🪡", "Money transfers 💰", "Annual trips ✈️"], correct: 1 },
        ],
      },
    ],
  },
];

// ─── Category definitions ─────────────────────────────────────────────────────

type Category = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  gradient: string;
  courseIds: string[];
};

const CATEGORIES: Category[] = [
  {
    id: "core-adventures",
    title: "Core Learning Adventures",
    emoji: "🏹",
    description: "Foundational courses on values, stories & timeless wisdom",
    gradient: "from-orange-400 to-amber-500",
    courseIds: ["know-your-ram", "geeta-gyan", "ganesha-fun-wisdom"],
  },
  {
    id: "festival-quests",
    title: "Festival Fun Quests",
    emoji: "🎉",
    description: "Fun story-based courses around India's vibrant festivals",
    gradient: "from-pink-500 to-purple-600",
    courseIds: ["victory-quest-dussehra", "diwali-adventure", "navratri-power-quest", "holi-fun-quest", "rakhi-bond-quest"],
  },
];

// ─── Mega-achievement definitions ─────────────────────────────────────────────

type MegaAchievement = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  requiredCourseIds: string[];
  color: string;
};

const MEGA_ACHIEVEMENTS: MegaAchievement[] = [
  {
    id: "festival-master",
    title: "Festival Master",
    emoji: "🎖️",
    description: "Complete all 5 Festival Fun Quests",
    requiredCourseIds: ["victory-quest-dussehra", "diwali-adventure", "navratri-power-quest", "holi-fun-quest", "rakhi-bond-quest"],
    color: "from-pink-500 to-purple-600",
  },
  {
    id: "little-dharmic-champion",
    title: "Little Dharmic Champion",
    emoji: "🏆",
    description: "Complete ALL 8 courses — the ultimate achievement!",
    requiredCourseIds: ["know-your-ram", "geeta-gyan", "ganesha-fun-wisdom", "victory-quest-dussehra", "diwali-adventure", "navratri-power-quest", "holi-fun-quest", "rakhi-bond-quest"],
    color: "from-yellow-400 to-orange-500",
  },
];

// ─── Progress helpers ─────────────────────────────────────────────────────────

function loadProgress(courseId: string): Progress {
  try {
    const raw = localStorage.getItem(`gurukul_sc_${courseId}`);
    return raw ? JSON.parse(raw) : { completed: [] };
  } catch {
    return { completed: [] };
  }
}

function saveProgress(courseId: string, progress: Progress) {
  localStorage.setItem(`gurukul_sc_${courseId}`, JSON.stringify(progress));
}

// ─── Confetti Component ───────────────────────────────────────────────────────

function Confetti() {
  const colors = ["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#f97316", "#ec4899"];
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: "-20px",
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, (Math.random() - 0.5) * 300],
            rotate: [0, Math.random() * 720 - 360],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 1.5,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

// ─── Stars background ─────────────────────────────────────────────────────────

function FloatingStars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl select-none"
          style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 3) * 30}%` }}
          animate={{ y: [0, -15, 0], rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
        >
          {["⭐", "✨", "🌟", "💫", "⭐", "✨", "🌟", "💫"][i]}
        </motion.div>
      ))}
    </div>
  );
}

// ─── NaradJi Mini Assistant ───────────────────────────────────────────────────

const NARAD_HINTS = [
  "Hey! I'm Narad Ji! 😄 Tap any chapter to start your adventure!",
  "Remember: Read the story first, then take the quiz! 📖✨",
  "You need 70% to pass and unlock the next chapter! You got this! 💪",
  "Fun fact: Ram's name has just 3 letters but infinite power! 🌟",
  "Jai Shri Ram! Keep going, you're doing amazing! 🏹",
  "The Geeta says: Your effort is in your hands — results are in God's! 💛",
  "Take a deep breath before the quiz. Focus like Arjuna! 🎯",
];

function NaradMini() {
  const [open, setOpen] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);

  function nextHint() {
    setHintIdx((h) => (h + 1) % NARAD_HINTS.length);
  }

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-16 left-0 w-64 bg-white rounded-2xl shadow-2xl border-2 border-yellow-300 p-4"
          >
            <div className="text-2xl mb-2 text-center">🎺</div>
            <p className="text-sm text-gray-700 text-center leading-relaxed">{NARAD_HINTS[hintIdx]}</p>
            <button
              onClick={nextHint}
              className="mt-3 w-full text-xs bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl transition-colors"
            >
              Next Tip ➡️
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full shadow-lg flex items-center justify-center text-2xl border-2 border-white"
        title="Narad Ji - Help!"
      >
        🎺
      </motion.button>
      <p className="text-[10px] text-center text-gray-500 mt-1 font-semibold">Narad Ji</p>
    </div>
  );
}

// ─── Canvas badge helper ──────────────────────────────────────────────────────

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}


function buildBadgeCanvas(course: Course, name: string, date: string): HTMLCanvasElement {
  const S = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  const isRam = course.id === "know-your-ram";
  const c1 = isRam ? "#f97316" : "#7c3aed";
  const c2 = isRam ? "#fb923c" : "#8b5cf6";
  const c3 = isRam ? "#fbbf24" : "#6366f1";
  const cDark = isRam ? "#c2410c" : "#5b21b6";
  const cGold = "#f59e0b";

  // ── Background gradient ──
  const bgGrad = ctx.createLinearGradient(0, 0, S, S);
  bgGrad.addColorStop(0, c1); bgGrad.addColorStop(0.55, c2); bgGrad.addColorStop(1, c3);
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, S, S);

  // Decorative translucent circles
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  [[-60,-60,380],[S+60,-60,300],[S+60,S+60,400],[-60,S+60,350],[S/2,S/2,500]].forEach(([cx,cy,r]) => {
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  });

  // ── White card ──
  const M = 64, R = 48;
  ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 32; ctx.shadowOffsetY = 8;
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  rrect(ctx, M, M, S-M*2, S-M*2, R); ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // ── Header band inside card ──
  const hH = 148;
  ctx.save();
  rrect(ctx, M, M, S-M*2, hH, R); ctx.clip();
  const hGrad = ctx.createLinearGradient(0, M, 0, M+hH);
  hGrad.addColorStop(0, c1); hGrad.addColorStop(1, c2);
  ctx.fillStyle = hGrad; ctx.fillRect(M, M, S-M*2, hH);
  ctx.restore();

  // Header shimmer strip
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(M, M, S-M*2, 4);

  // Temple name in header
  ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = `bold 26px 'Georgia', serif`;
  ctx.fillText("Bhartiya Hindu Temple Gurukul", S/2, M+48);
  ctx.font = `22px 'Georgia', serif`;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.fillText("Student's Corner  •  Certificate of Achievement", S/2, M+90);

  // ── Gold border on card ──
  ctx.strokeStyle = cGold; ctx.lineWidth = 4;
  rrect(ctx, M, M, S-M*2, S-M*2, R); ctx.stroke();
  // Inner dashed frame
  ctx.strokeStyle = isRam ? "#fde68a" : "#ddd6fe"; ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  rrect(ctx, M+14, M+14, S-M*2-28, S-M*2-28, R-8); ctx.stroke();
  ctx.setLineDash([]);

  // ── Trophy & course emoji ──
  ctx.font = `90px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',serif`;
  ctx.fillText("🏆", S/2 - 58, M + hH + 110);
  ctx.fillText(course.emoji, S/2 + 58, M + hH + 110);

  // ── "CERTIFICATE OF ACHIEVEMENT" ──
  ctx.font = `bold 52px 'Georgia', serif`; ctx.fillStyle = cDark;
  ctx.fillText("Certificate of Achievement", S/2, M + hH + 175);

  // Gold divider
  const divY = M + hH + 198;
  const divGrad = ctx.createLinearGradient(M+80, divY, S-M-80, divY);
  divGrad.addColorStop(0, "transparent"); divGrad.addColorStop(0.3, cGold);
  divGrad.addColorStop(0.7, cGold); divGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = divGrad; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(M+80, divY); ctx.lineTo(S-M-80, divY); ctx.stroke();

  // ── "This certifies that" ──
  ctx.font = `italic 30px 'Georgia', serif`; ctx.fillStyle = "#9ca3af";
  ctx.fillText("This certifies that", S/2, M + hH + 255);

  // ── Student name ──
  const displayName = name || "Little Champion";
  const nameFontSize = displayName.length > 22 ? 56 : displayName.length > 16 ? 64 : 72;
  ctx.font = `bold ${nameFontSize}px 'Georgia', serif`; ctx.fillStyle = isRam ? "#d97706" : "#6d28d9";
  ctx.fillText(displayName, S/2, M + hH + 340);

  // Underline below name
  const nameW = Math.min(ctx.measureText(displayName).width + 40, S - M*2 - 80);
  const ulY = M + hH + 358;
  ctx.strokeStyle = isRam ? "#fbbf24" : "#a78bfa"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(S/2 - nameW/2, ulY); ctx.lineTo(S/2 + nameW/2, ulY); ctx.stroke();

  // ── "has successfully completed" ──
  ctx.font = `italic 30px 'Georgia', serif`; ctx.fillStyle = "#9ca3af";
  ctx.fillText("has successfully completed", S/2, M + hH + 418);

  // ── Course name ──
  ctx.font = `bold 48px 'Georgia', serif`; ctx.fillStyle = cDark;
  ctx.fillText(course.title, S/2, M + hH + 490);

  // ── Badge pill ──
  const pillW = 360, pillH = 60, pillX = S/2-pillW/2, pillY = M+hH+520;
  const pillGrad = ctx.createLinearGradient(pillX, 0, pillX+pillW, 0);
  pillGrad.addColorStop(0, c1); pillGrad.addColorStop(1, c3);
  ctx.fillStyle = pillGrad;
  rrect(ctx, pillX, pillY, pillW, pillH, pillH/2); ctx.fill();
  ctx.font = `bold 28px 'Georgia', serif`; ctx.fillStyle = "white";
  ctx.fillText(`${course.badgeEmoji}  ${course.badge}  ${course.badgeEmoji}`, S/2, pillY + 41);

  // ── Stats row ──
  const statsY = M + hH + 640;
  ctx.font = `22px 'Georgia', serif`; ctx.fillStyle = "#6b7280";
  ctx.fillText(`All ${course.chapters.length} chapters completed  •  All quizzes passed  •  Score ≥ 70%`, S/2, statsY);

  // ── Completion date ──
  ctx.font = `24px 'Georgia', serif`; ctx.fillStyle = "#9ca3af";
  ctx.fillText(`Completed on ${date}`, S/2, statsY + 50);

  // ── Footer divider ──
  const ftY = S - M - 88;
  const ftGrad = ctx.createLinearGradient(M+60, ftY, S-M-60, ftY);
  ftGrad.addColorStop(0,"transparent"); ftGrad.addColorStop(0.3,cGold);
  ftGrad.addColorStop(0.7,cGold); ftGrad.addColorStop(1,"transparent");
  ctx.strokeStyle = ftGrad; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(M+60, ftY); ctx.lineTo(S-M-60, ftY); ctx.stroke();

  // ── Verified footer ──
  ctx.font = `bold 24px 'Georgia', serif`; ctx.fillStyle = c1;
  ctx.fillText("✓ Verified by Bhartiya Hindu Temple Gurukul — Powell, OH", S/2, S - M - 44);

  return canvas;
}

// ── Social SVG icons ──
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

// ─── Certificate Component ────────────────────────────────────────────────────

function Certificate({ course, studentName }: { course: Course; studentName: string }) {
  const [badgeUrl, setBadgeUrl]   = useState<string | null>(null);
  const [copied, setCopied]       = useState(false);
  const [igTip, setIgTip]         = useState(false);
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const siteUrl  = encodeURIComponent("https://gurukul.bhtohio.org/students-corner");
  const caption  = `🎉 I just earned the "${course.badge}" ${course.badgeEmoji} badge by completing "${course.title}" at Bhartiya Hindu Temple Gurukul's Student's Corner! All quizzes passed. 🌟 #HinduKids #Gurukul #BHTGurukul #Learning #CertificateOfAchievement`;
  const liText   = encodeURIComponent(caption);
  const fbUrl    = `https://www.facebook.com/sharer/sharer.php?u=${siteUrl}&quote=${encodeURIComponent(caption)}`;
  const liUrl    = `https://www.linkedin.com/sharing/share-offsite/?url=${siteUrl}&summary=${liText}`;

  useEffect(() => {
    const canvas = buildBadgeCanvas(course, studentName, date);
    setBadgeUrl(canvas.toDataURL("image/png", 1.0));
  }, [course, studentName]);

  function handleDownload() {
    if (!badgeUrl) return;
    const a = document.createElement("a");
    a.download = `${course.title.replace(/\s+/g, "_")}_Badge.png`;
    a.href = badgeUrl;
    a.click();
  }

  function handleInstagram() {
    handleDownload();
    setIgTip(true);
    setTimeout(() => setIgTip(false), 6000);
  }

  function handleCopy() {
    navigator.clipboard.writeText(caption).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-5">

      {/* Badge preview */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-300">
        {badgeUrl ? (
          <img src={badgeUrl} alt="Achievement badge" className="w-full block" />
        ) : (
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
              <Star className="w-10 h-10 text-amber-400" />
            </motion.div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            ✓ Verified
          </span>
        </div>
      </div>

      {/* Caption to copy */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">📋 Caption to Copy</p>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${copied ? "bg-green-500 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}`}
          >
            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{caption}</p>
      </div>

      {/* Share buttons */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-3">
          🌍 Share Your Achievement
        </p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* LinkedIn */}
          <a
            href={liUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold px-4 py-3 rounded-2xl text-sm transition-colors shadow-md"
          >
            <LinkedInIcon /> LinkedIn <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
          {/* Facebook */}
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#0e5fc0] text-white font-bold px-4 py-3 rounded-2xl text-sm transition-colors shadow-md"
          >
            <FacebookIcon /> Facebook <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Instagram */}
          <button
            onClick={handleInstagram}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#f9a825] via-[#e91e8c] to-[#6b2fa0] text-white font-bold px-4 py-3 rounded-2xl text-sm transition-opacity hover:opacity-90 shadow-md"
          >
            <InstagramIcon /> Instagram
          </button>
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!badgeUrl}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-bold px-4 py-3 rounded-2xl text-sm transition-colors shadow-md"
          >
            <Download className="w-4 h-4" /> Download PNG
          </button>
        </div>
      </div>

      {/* Instagram tip banner */}
      <AnimatePresence>
        {igTip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4 text-sm text-gray-700"
          >
            <p className="font-bold text-pink-600 mb-1">📱 Instagram Steps:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-xs leading-relaxed">
              <li>Your badge image was just downloaded</li>
              <li>Open Instagram on your phone</li>
              <li>Tap <strong>+</strong> → Post or Story → select the downloaded image</li>
              <li>Paste the caption (tap Copy Caption above first!)</li>
              <li>Share and celebrate! 🎉</li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size note */}
      <p className="text-center text-xs text-gray-400">
        1200 × 1200 px  •  Optimised for LinkedIn, Facebook & Instagram
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = "home" | "course" | "chapter" | "quiz" | "celebrate";

export default function StudentsCorner() {
  const [view, setView] = useState<View>("home");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [studentName, setStudentName] = useState(() => localStorage.getItem("gurukul_sc_name") || "");
  const [nameInput, setNameInput] = useState(false);
  const [tempName, setTempName] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  const LOADING_MESSAGES = [
    "Getting your adventure ready… 🚀",
    "Summoning the wisdom of the ages… 📖",
    "Asking Narad Ji to guide you… 🎺",
    "Lighting the lamp of knowledge… 🪔",
    "Loading your heroic quest… 🏹",
  ];

  function fakeLoad(cb: () => void) {
    const msg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    setLoadingMessage(msg);
    setTimeout(() => { setLoadingMessage(""); cb(); }, 800);
  }

  useEffect(() => {
    const p: Record<string, Progress> = {};
    COURSES.forEach((c) => { p[c.id] = loadProgress(c.id); });
    setProgress(p);
  }, []);

  const getProgress = useCallback((courseId: string) => progress[courseId] ?? { completed: [] }, [progress]);

  function markComplete(courseId: string, chapterId: string) {
    const prev = getProgress(courseId);
    if (prev.completed.includes(chapterId)) return prev;
    const next = { completed: [...prev.completed, chapterId] };
    saveProgress(courseId, next);
    setProgress((p) => ({ ...p, [courseId]: next }));
    return next;
  }

  function isUnlocked(course: Course, chapterIdx: number): boolean {
    if (chapterIdx === 0) return true;
    const prog = getProgress(course.id);
    return prog.completed.includes(course.chapters[chapterIdx - 1].id);
  }

  function isCompleted(course: Course, chapterId: string): boolean {
    return getProgress(course.id).completed.includes(chapterId);
  }

  function handleStartCourse(course: Course) {
    fakeLoad(() => { setSelectedCourse(course); setView("course"); });
  }

  function handleOpenChapter(chapter: Chapter) {
    fakeLoad(() => {
      setSelectedChapter(chapter);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      setView("chapter");
    });
  }

  function handleStartQuiz() {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setView("quiz");
  }

  function handleSubmitQuiz() {
    if (!selectedChapter) return;
    let correct = 0;
    selectedChapter.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) correct++;
    });
    const score = Math.round((correct / selectedChapter.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (score >= 70 && selectedCourse && selectedChapter) {
      const newProg = markComplete(selectedCourse.id, selectedChapter.id);
      // Check if whole course is done
      if (newProg.completed.length === selectedCourse.chapters.length) {
        setTimeout(() => {
          setShowConfetti(true);
          setView("celebrate");
          setTimeout(() => setShowConfetti(false), 5000);
        }, 1500);
      }
    }
  }

  function handleSaveName() {
    const n = tempName.trim();
    if (n) {
      setStudentName(n);
      localStorage.setItem("gurukul_sc_name", n);
    }
    setNameInput(false);
  }

  function goHome() { setView("home"); setSelectedCourse(null); setSelectedChapter(null); }
  function goCourse() { setView("course"); setSelectedChapter(null); }

  // ── Loading overlay ──
  if (loadingMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-50">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-6xl mb-6"
        >🚀</motion.div>
        <p className="text-xl font-bold text-orange-600">{loadingMessage}</p>
      </div>
    );
  }

  // ── Celebration screen ──
  if (view === "celebrate" && selectedCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-orange-100 to-pink-100 flex flex-col items-center justify-center px-4 py-10">
        {showConfetti && <Confetti />}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-center mb-8"
        >
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-4xl font-black text-secondary mb-2">Yay! You Did It!</h1>
          <p className="text-2xl font-bold text-orange-500 mb-1">Superstar! 🌟</p>
          <p className="text-gray-600 font-medium">You completed <strong>{selectedCourse.title}</strong>!</p>
        </motion.div>

        {/* Name entry */}
        <div className="mb-6 text-center">
          {studentName ? (
            <div className="flex items-center gap-2 justify-center">
              <span className="text-lg font-bold text-purple-700">🎓 {studentName}</span>
              <button onClick={() => { setTempName(studentName); setNameInput(true); }} className="text-xs text-gray-400 underline">change</button>
            </div>
          ) : (
            <button
              onClick={() => { setTempName(""); setNameInput(true); }}
              className="bg-orange-400 text-white font-bold px-5 py-2 rounded-2xl text-sm shadow-lg hover:bg-orange-500 transition-colors"
            >
              Enter Your Name for Certificate ✍️
            </button>
          )}
          {nameInput && (
            <div className="mt-3 flex gap-2 justify-center">
              <input
                autoFocus
                className="border-2 border-purple-300 rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-purple-500"
                placeholder="Your name…"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button onClick={handleSaveName} className="bg-purple-500 text-white font-bold px-4 py-2 rounded-2xl text-sm">Save</button>
            </div>
          )}
        </div>

        <Certificate course={selectedCourse} studentName={studentName} />

        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          <button
            onClick={goHome}
            className="flex items-center gap-2 bg-white border-2 border-purple-300 text-purple-700 font-bold px-6 py-3 rounded-2xl shadow-md hover:bg-purple-50 transition-colors"
          >
            <Home className="w-4 h-4" /> Try Another Course
          </button>
          <Link href="/">
            <button className="flex items-center gap-2 bg-orange-400 text-white font-bold px-6 py-3 rounded-2xl shadow-lg hover:bg-orange-500 transition-colors">
              Back to Website 🏠
            </button>
          </Link>
        </div>
        <NaradMini />
      </div>
    );
  }

  // ── Quiz screen ──
  if (view === "quiz" && selectedChapter) {
    const total = selectedChapter.quiz.length;
    const answeredAll = Object.keys(quizAnswers).length === total;

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView("chapter")} className="text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Quiz Time! 🎮</p>
              <h1 className="text-xl font-black text-secondary">{selectedChapter.title}</h1>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-5">
            {selectedChapter.quiz.map((q, qi) => (
              <motion.div
                key={qi}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.1 }}
                className="bg-white rounded-3xl shadow-md p-5 border-2 border-blue-100"
              >
                <p className="font-bold text-gray-800 mb-4 text-base">
                  <span className="text-blue-500 font-black mr-2">Q{qi + 1}.</span>{q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => {
                    let cls = "w-full text-left px-4 py-2.5 rounded-2xl border-2 font-semibold text-sm transition-all ";
                    if (!quizSubmitted) {
                      cls += quizAnswers[qi] === oi
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50";
                    } else {
                      if (oi === q.correct) cls += "border-green-500 bg-green-50 text-green-700";
                      else if (quizAnswers[qi] === oi && oi !== q.correct) cls += "border-red-400 bg-red-50 text-red-600";
                      else cls += "border-gray-200 bg-gray-50 text-gray-500";
                    }
                    return (
                      <button key={oi} className={cls} disabled={quizSubmitted} onClick={() => setQuizAnswers((a) => ({ ...a, [qi]: oi }))}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-3 text-sm font-bold ${quizAnswers[qi] === q.correct ? "text-green-600" : "text-red-500"}`}
                  >
                    {quizAnswers[qi] === q.correct ? "✅ Awesome! You got it right! 🎉" : `❌ Oops! The answer was: ${q.options[q.correct]}`}
                  </motion.p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Submit / Result */}
          {!quizSubmitted ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!answeredAll}
              onClick={handleSubmitQuiz}
              className="mt-6 w-full bg-gradient-to-r from-blue-500 to-indigo-500 disabled:from-gray-300 disabled:to-gray-400 text-white font-black text-lg py-4 rounded-3xl shadow-xl transition-all"
            >
              {answeredAll ? "Submit Answers! 🚀" : `Answer all ${total} questions first 📝`}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 bg-white rounded-3xl shadow-xl p-6 text-center border-2 border-indigo-100"
            >
              <div className="text-5xl mb-3">{quizScore >= 70 ? "🎉" : "💪"}</div>
              <h2 className="text-3xl font-black text-secondary mb-1">
                Score: {quizScore}%
              </h2>
              {quizScore >= 70 ? (
                <p className="text-green-600 font-bold text-lg mb-4">Fantastic! You passed! Chapter unlocked! 🔓✨</p>
              ) : (
                <p className="text-orange-500 font-bold text-lg mb-4">Try again champ! You need 70% to pass! 💪</p>
              )}
              <div className="flex gap-3 flex-wrap justify-center">
                {quizScore < 70 && (
                  <button
                    onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizScore(0); }}
                    className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded-2xl transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Try Again
                  </button>
                )}
                <button
                  onClick={goCourse}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-2xl transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  {quizScore >= 70 ? "Next Chapter!" : "Back to Chapters"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
        <NaradMini />
      </div>
    );
  }

  // ── Chapter screen ──
  if (view === "chapter" && selectedChapter && selectedCourse) {
    const done = isCompleted(selectedCourse, selectedChapter.id);
    return (
      <div className={`min-h-screen px-4 py-8 ${selectedCourse.cardBg}`}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={goCourse} className={`${selectedCourse.textAccent} hover:opacity-80 transition-opacity`}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${selectedCourse.textAccent}`}>{selectedCourse.title}</p>
              <h1 className="text-2xl font-black text-secondary">{selectedChapter.title}</h1>
            </div>
            {done && <CheckCircle2 className="w-6 h-6 text-green-500 ml-auto shrink-0" />}
          </div>

          {/* Value badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-amber-200 rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700">Value: {selectedChapter.value}</span>
          </div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg p-6 mb-5 border border-gray-100"
          >
            <div className="text-5xl text-center mb-4">{selectedChapter.emoji}</div>
            {selectedChapter.story.split("\n\n").map((para, i) => (
              <p key={i} className="text-gray-700 leading-relaxed mb-3 text-base">{para}</p>
            ))}
          </motion.div>

          {/* Real-life example */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 border-l-4 border-amber-400 rounded-2xl p-4 mb-5"
          >
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">🌍 Real Life Example</p>
            <p className="text-gray-700 font-medium">{selectedChapter.example}</p>
          </motion.div>

          {/* Takeaway */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-2xl p-4 mb-8 text-center"
          >
            <Star className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-green-800 font-bold text-sm">{selectedChapter.takeaway}</p>
          </motion.div>

          {/* Quiz button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStartQuiz}
            className={`w-full py-4 rounded-3xl text-white font-black text-xl shadow-2xl bg-gradient-to-r ${selectedCourse.gradient} flex items-center justify-center gap-3`}
          >
            🎮 Take the Quiz!
            <ChevronRight className="w-6 h-6" />
          </motion.button>
          {done && <p className="text-center text-green-600 font-semibold text-sm mt-3">✅ You've already passed this quiz! Retake anytime.</p>}
        </div>
        <NaradMini />
      </div>
    );
  }

  // ── Course screen ──
  if (view === "course" && selectedCourse) {
    const prog = getProgress(selectedCourse.id);
    const completedCount = prog.completed.length;
    const totalChapters = selectedCourse.chapters.length;
    const pct = Math.round((completedCount / totalChapters) * 100);
    const allDone = completedCount === totalChapters;

    return (
      <div className={`min-h-screen px-4 py-8 ${selectedCourse.cardBg}`}>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={goHome} className={`${selectedCourse.textAccent} hover:opacity-80 transition-opacity`}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-4xl">{selectedCourse.emoji}</span>
            <div>
              <h1 className="text-2xl font-black text-secondary">{selectedCourse.title}</h1>
              <p className="text-sm text-gray-500">{completedCount}/{totalChapters} chapters completed</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="my-4 bg-white/60 rounded-full h-4 overflow-hidden shadow-inner border border-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${selectedCourse.gradient}`}
            />
          </div>
          <p className={`text-xs font-bold ${selectedCourse.textAccent} mb-6`}>
            {pct === 0 ? "Start your adventure! 🚀" : pct === 100 ? "All chapters complete! 🌟" : `${pct}% complete — keep going! 💪`}
          </p>

          {/* Chapter list */}
          <div className="space-y-3">
            {selectedCourse.chapters.map((chapter, idx) => {
              const unlocked = isUnlocked(selectedCourse, idx);
              const done = isCompleted(selectedCourse, chapter.id);
              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                >
                  <button
                    disabled={!unlocked}
                    onClick={() => unlocked && handleOpenChapter(chapter)}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 shadow-sm transition-all ${
                      done
                        ? "bg-green-50 border-green-300 hover:shadow-md"
                        : unlocked
                        ? "bg-white border-gray-200 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5"
                        : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      done ? "bg-green-100" : unlocked ? "bg-amber-100" : "bg-gray-100"
                    }`}>
                      {done ? "✅" : unlocked ? chapter.emoji : "🔒"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-secondary truncate">{chapter.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Value: {chapter.value}</p>
                    </div>
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : unlocked ? (
                      <ChevronRight className={`w-5 h-5 shrink-0 ${selectedCourse.textAccent}`} />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Course complete CTA */}
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-3xl p-6 text-center shadow-xl"
            >
              <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-2xl font-black text-secondary mb-1">Course Complete! 🎉</h3>
              <p className="text-gray-600 mb-4">You are a true <strong>{selectedCourse.badge}</strong>! {selectedCourse.badgeEmoji}</p>
              <button
                onClick={() => { setShowConfetti(true); setView("celebrate"); setTimeout(() => setShowConfetti(false), 5000); }}
                className={`bg-gradient-to-r ${selectedCourse.gradient} text-white font-black px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-shadow text-lg`}
              >
                🏆 View Certificate!
              </button>
            </motion.div>
          )}
        </div>
        {showConfetti && <Confetti />}
        <NaradMini />
      </div>
    );
  }

  // ── Home screen ──
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-orange-100 to-pink-100" />
      <FloatingStars />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 text-center">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <h1 className="text-4xl sm:text-5xl font-black text-secondary mb-2 leading-tight">
            🎉 Student's Corner
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-orange-500 mb-2">Learn, Play & Shine!</p>
        </motion.div>

        {/* Welcome message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur rounded-3xl p-5 mb-8 shadow-lg border border-white/80 max-w-lg mx-auto"
        >
          <p className="text-2xl mb-2">🙏 Namaste Little Champs!</p>
          {studentName && <p className="text-orange-500 font-bold text-lg mb-1">Welcome back, {studentName}! 🌟</p>}
          <p className="text-gray-700 font-medium leading-relaxed">
            Let's go on a fun journey of stories, wisdom, and exciting challenges!
            Pick a course below and start your adventure! 🚀
          </p>
        </motion.div>

        {/* Name entry */}
        <div className="mb-6">
          {!studentName && !nameInput && (
            <button
              onClick={() => { setTempName(""); setNameInput(true); }}
              className="text-sm bg-white/80 hover:bg-white border border-orange-200 text-orange-600 font-bold px-5 py-2 rounded-2xl shadow transition-colors"
            >
              ✍️ Enter Your Name
            </button>
          )}
          {nameInput && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-center flex-wrap">
              <input
                autoFocus
                className="border-2 border-orange-300 rounded-2xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-orange-500 shadow-sm"
                placeholder="Your name here…"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button onClick={handleSaveName} className="bg-orange-400 hover:bg-orange-500 text-white font-bold px-5 py-2 rounded-2xl text-sm transition-colors shadow">Save</button>
              <button onClick={() => setNameInput(false)} className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3">cancel</button>
            </motion.div>
          )}
          {studentName && (
            <button onClick={() => { setTempName(studentName); setNameInput(true); }} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Change name
            </button>
          )}
        </div>

        {/* Category sections */}
        {CATEGORIES.map((cat, catIdx) => {
          const catCourses = COURSES.filter((c) => cat.courseIds.includes(c.id));
          return (
            <div key={cat.id} className="mb-12 text-left max-w-7xl mx-auto">
              {/* Category header */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + catIdx * 0.15 }}
                className={`inline-flex items-center gap-3 bg-gradient-to-r ${cat.gradient} text-white px-6 py-3 rounded-2xl shadow-lg mb-5`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <p className="font-black text-lg leading-tight">{cat.title}</p>
                  <p className="text-white/80 text-xs font-medium">{cat.description}</p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {catCourses.map((course, i) => {
                  const prog = getProgress(course.id);
                  const completed = prog.completed.length;
                  const total = course.chapters.length;
                  const pct = Math.round((completed / total) * 100);
                  const isFinished = pct === 100;
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + catIdx * 0.1 + i * 0.1, type: "spring", bounce: 0.3 }}
                      whileHover={{ y: -6, transition: { duration: 0.2 } }}
                      className="bg-white rounded-3xl shadow-xl border border-white/80 overflow-hidden cursor-pointer"
                      onClick={() => handleStartCourse(course)}
                    >
                      {/* Card header */}
                      <div className={`h-28 bg-gradient-to-br ${course.gradient} flex items-center justify-center relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-20">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="absolute w-14 h-14 rounded-full bg-white/30"
                              style={{ left: `${j * 22}%`, top: `${(j % 3) * 30}%` }} />
                          ))}
                        </div>
                        <span className="text-6xl drop-shadow-lg relative z-10">{course.emoji}</span>
                        {isFinished && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
                            ✅ Done!
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h2 className="text-lg font-black text-secondary mb-1">{course.title}</h2>
                        <p className="text-gray-500 text-xs leading-relaxed mb-3">{course.description}</p>

                        {/* Mini progress bar */}
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${course.gradient} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-400 shrink-0">{completed}/{total}</span>
                        </div>
                        <p className={`text-xs font-semibold mb-4 ${course.textAccent}`}>
                          {pct === 0 ? "Not started yet 🚀" : pct === 100 ? `${course.badgeEmoji} ${course.badge} Earned!` : `${pct}% complete 💪`}
                        </p>

                        <button className={`w-full py-3 rounded-2xl text-white font-black text-sm bg-gradient-to-r ${course.gradient} shadow-md hover:shadow-lg transition-shadow`}>
                          {pct === 0 ? "Start Adventure! 🚀" : pct === 100 ? "View Certificate 🏆" : "Continue Journey! ⚡"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Mega Achievements ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="text-center mb-5">
            <span className="text-3xl">🏆</span>
            <h2 className="text-2xl font-black text-secondary mt-1">Mega Achievements</h2>
            <p className="text-gray-500 text-sm">Complete multiple courses to unlock these special awards!</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MEGA_ACHIEVEMENTS.map((ach) => {
              const earned = ach.requiredCourseIds.every((cid) => {
                const c = COURSES.find((x) => x.id === cid);
                if (!c) return false;
                return getProgress(cid).completed.length === c.chapters.length;
              });
              const doneCount = ach.requiredCourseIds.filter((cid) => {
                const c = COURSES.find((x) => x.id === cid);
                if (!c) return false;
                return getProgress(cid).completed.length === c.chapters.length;
              }).length;
              const pct = Math.round((doneCount / ach.requiredCourseIds.length) * 100);
              return (
                <div
                  key={ach.id}
                  className={`relative rounded-3xl border-2 p-5 shadow-lg transition-all ${
                    earned
                      ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400"
                      : "bg-white border-gray-200 opacity-80"
                  }`}
                >
                  {earned && (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -top-3 -right-3 text-3xl"
                    >✨</motion.div>
                  )}
                  <div className="text-4xl mb-2">{earned ? ach.emoji : "🔒"}</div>
                  <h3 className="font-black text-secondary text-base mb-1">{ach.title}</h3>
                  <p className="text-gray-500 text-xs mb-3">{ach.description}</p>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${ach.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">
                    {doneCount}/{ach.requiredCourseIds.length} courses complete
                    {earned && " 🎉"}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
      <NaradMini />
    </div>
  );
}
