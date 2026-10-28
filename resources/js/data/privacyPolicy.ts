/**
 * Kere's Privacy Policy, version 1.2 (effective 20 September 2026, updated
 * 26 October 2026), as revised for Flitt's merchant review. The Georgian text
 * prevails (section 20); the English is a translation of it. One row is added
 * to the supplied text at the owner's request: measurements saved on the
 * profile (section 13), which is why the row before it says "given for an
 * order". Kept here rather than in the locale JSON because it is a long legal
 * document. PrivacyPolicy.tsx renders the active language.
 */
import type { LegalDocument } from '../types/legal';

const ka: LegalDocument = {
    title: 'პერსონალურ მონაცემთა დაცვისა და კონფიდენციალურობის პოლიტიკა',
    lead: 'ვრცელდება KereForYou-ის ვებგვერდზე, აპლიკაციასა და მასთან დაკავშირებულ მომსახურებებზე',
    meta: [
        { label: 'ვერსია', value: '1.2' },
        { label: 'ძალაში შესვლის თარიღი', value: '20 სექტემბერი 2026' },
        { label: 'ბოლო განახლება', value: '26 ოქტომბერი 2026' },
    ],
    summary: 'ეს პოლიტიკა განმარტავს, როგორ აგროვებს, იყენებს, ინახავს, უზიარებს და იცავს შპს „კერე შენთვის“ პერსონალურ მონაცემებს და როგორ შეუძლია მონაცემთა სუბიექტს საკუთარი უფლებების განხორციელება. კერე ამუშავებს მხოლოდ იმ მონაცემებს, რომლებიც საჭიროა ანგარიშის შექმნის, ინდივიდუალური შეკვეთის მიღებისა და შესრულების, გადახდის, მიწოდების, უსაფრთხოებისა და კანონით დაკისრებული ვალდებულებების შესრულებისთვის.',
    sections: [
        {
            id: 'overview',
            title: 'მოკლე მიმოხილვა',
            blocks: [
                {
                    type: 'ul',
                    items: [
                        'Kere-ის მიერ შერჩეული შემსრულებელი იღებს მხოლოდ შეკვეთის შესასრულებლად აუცილებელ ინფორმაციას; მომხმარებელთან კომუნიკაცია და მისგან გადახდის მიღება ხორციელდება მხოლოდ Kere-ის მეშვეობით.',
                        'სრული საბარათე მონაცემები შეჰყავს მომხმარებელს უშუალოდ საგადახდო პროვაიდერის დაცულ გარემოში; კერე არ ინახავს ბარათის სრულ ნომერს, მოქმედების ვადას ან CVV/CVC კოდს.',
                        'Kere უფლებამოსილია უსაფრთხოების, დავების გადაწყვეტისა და პლატფორმის წესების დაცვის მიზნით შეამოწმოს პლატფორმის ჩათში გაცვლილი შეტყობინებები.',
                        '16 წლამდე პირი კერეზე ვერ რეგისტრირდება. 16–17 წლის პირის რეგისტრაცია დასაშვებია მშობლის ან სხვა კანონიერი წარმომადგენლის ელექტრონული თანხმობით.',
                    ],
                },
            ],
        },
        {
            id: 'section-1',
            title: '1 ვინ ვართ და როგორ დაგვიკავშირდეთ',
            blocks: [
                { type: 'p', text: 'პერსონალურ მონაცემთა დამუშავებისთვის პასუხისმგებელი პირია:' },
                {
                    type: 'ul',
                    items: [
                        'დასახელება: შპს „კერე შენთვის“',
                        'საიდენტიფიკაციო კოდი: 406562376',
                        'ვებგვერდი: https://kereforyou.com/',
                        'პერსონალურ მონაცემებთან დაკავშირებული საკითხები: kereforyou@gmail.com',
                    ],
                },
                { type: 'p', text: 'ამ ელფოსტაზე შეგიძლიათ გამოგვიგზავნოთ მოთხოვნა თქვენი მონაცემების, ამ პოლიტიკის ან მონაცემთა უსაფრთხოების საკითხებთან დაკავშირებით.' },
            ],
        },
        {
            id: 'section-2',
            title: '2 ვისზე და რაზე ვრცელდება პოლიტიკა',
            blocks: [
                { type: 'p', text: 'პოლიტიკა ვრცელდება:' },
                {
                    type: 'ul',
                    items: [
                        'კერეს მომხმარებლებზე და ვებგვერდის ვიზიტორებზე;',
                        'Kere-ის მკერავ სპეციალისტებზე, ატელიეებსა და მათ უფლებამოსილ წარმომადგენლებზე;',
                        'მშობლებზე ან კანონიერ წარმომადგენლებზე, რომლებიც თანხმობას გასცემენ 16–17 წლის მომხმარებლისთვის;',
                        'პირებზე, რომლებიც გვიკავშირდებიან ჩათით, ელფოსტით, ტელეფონით ან მხარდაჭერის სხვა არხით.',
                    ],
                },
                { type: 'p', text: 'საგადახდო პროვაიდერები, ბანკები, კურიერები და სხვა დამოუკიდებელი ორგანიზაციები მონაცემებს შესაძლოა საკუთარი კონფიდენციალურობის პოლიტიკის შესაბამისადაც ამუშავებდნენ. მათ მიერ დამოუკიდებლად განხორციელებულ დამუშავებაზე ვრცელდება მათი შესაბამისი პირობები.' },
            ],
        },
        {
            id: 'section-3',
            title: '3 მონაცემთა დამუშავების ძირითადი პრინციპები',
            blocks: [
                { type: 'p', text: 'Kere მონაცემებს ამუშავებს კანონიერად, სამართლიანად და გამჭვირვალედ. მონაცემები გროვდება კონკრეტული მიზნებისთვის, მხოლოდ აუცილებელი მოცულობით, ინახება საჭირო ვადით და დაცულია შესაბამისი ტექნიკური და ორგანიზაციული ზომებით. კერე პერიოდულად ამოწმებს მონაცემთა სიზუსტეს, წვდომის უფლებებსა და შენახვის საჭიროებას.' },
            ],
        },
        {
            id: 'section-4',
            title: '4 რა მონაცემებს ვამუშავებთ',
            blocks: [
                { type: 'h3', text: '4.1 მომხმარებლის მონაცემები' },
                {
                    type: 'ul',
                    items: [
                        'საიდენტიფიკაციო და საკონტაქტო მონაცემები: სახელი, გვარი, დაბადების თარიღი, ტელეფონი და ელფოსტა;',
                        'ანგარიშის მონაცემები: რეგისტრაციის, ავტორიზაციისა და ვერიფიკაციის ჩანაწერები;',
                        'ინდივიდუალური ზომები და მორგების ინფორმაცია;',
                        'მომხმარებლის მიერ ატვირთული ფოტოები, დიზაინები, ესკიზები, ფაილები და სხვა მასალა;',
                        'შეკვეთის ინფორმაცია: სამოსის კატეგორია, მოდელი, ქსოვილი, ფერი, დეტალები, სასურველი ფასის დიაპაზონი, საბოლოო ფასი, ვადა და შეკვეთის სტატუსი;',
                        'მიწოდების ინფორმაცია: მიმღების სახელი, ტელეფონი, მისამართი და მიწოდების ინსტრუქცია;',
                        'ტრანზაქციის შეზღუდული ინფორმაცია: თანხა, ვალუტა, გადახდის სტატუსი, თარიღი, შეკვეთისა და ტრანზაქციის იდენტიფიკატორები;',
                        'კომუნიკაცია: მომხმარებელსა და Kere-ს შორის პლატფორმის ჩათი, მხარდაჭერის მოთხოვნები, საჩივრები, დავასთან დაკავშირებული მტკიცებულებები და Kere-ის მომსახურებაზე უკუკავშირი;',
                        'ტექნიკური მონაცემები: IP მისამართი, მოწყობილობისა და ბრაუზერის ტიპი, სესიის, უსაფრთხოებისა და სისტემური მოქმედებების ჩანაწერები.',
                    ],
                },
                { type: 'h3', text: '4.2 შემსრულებლების სტატუსი და მათი მონაცემები' },
                {
                    type: 'ul',
                    items: [
                        'მკერავი სპეციალისტები და ატელიეები არიან Kere-ის მიერ შერჩეული და მასთან სახელშეკრულებო ურთიერთობაში მყოფი შემსრულებლები.',
                        'მათი სახელი, კონტაქტი, კვალიფიკაცია, სპეციალიზაცია, გამოცდილება და დატვირთვა მუშავდება Kere-ის შიდა მიზნებისთვის: შეკვეთის განაწილება, ხარისხის კონტროლი და სამუშაოს შესრულების ორგანიზება. ეს ინფორმაცია არ ქვეყნდება საჯაროდ და არ ქმნის შემსრულებლის არჩევის შესაძლებლობას მომხმარებლისთვის.',
                        'ასევე მუშავდება სამეწარმეო ან იურიდიული რეგისტრაციის ინფორმაცია, საჭიროების შემთხვევაში წარმომადგენლობითი უფლებამოსილების დოკუმენტი, საბანკო ანგარიშისა და ანგარიშსწორების ინფორმაცია, Kere-სთვის წარდგენილი შიდა ფასობრივი შეფასებები, მიღებული და შესრულებული შეკვეთების, ვადებისა და ხარისხის კონტროლის ჩანაწერები. ეს მონაცემები გამოიყენება მხოლოდ Kere-ის შიდა სახელშეკრულებო ურთიერთობის, ანგარიშსწორებისა და შესაბამისი სამართლებრივი ვალდებულებების შესასრულებლად. შემსრულებლებთან ანგარიშსწორება ხდება Kere-ის შიდა სახელშეკრულებო ურთიერთობის საფუძველზე. მომხმარებელი ამ ანგარიშსწორების მხარე არ არის და გადახდას ახორციელებს მხოლოდ Kere-ს.',
                        'შემსრულებლის კომუნიკაციის მონაცემები მოიცავს მხოლოდ Kere-სთან სამუშაოს ორგანიზებისა და შესრულების ფარგლებში გაცვლილ ინფორმაციას. მომსახურების ერთიანი ხარისხის, მომხმარებლის უსაფრთხოებისა და შეკვეთის სწორი მართვისთვის შეკვეთასთან დაკავშირებული კომუნიკაცია და გადახდა ხორციელდება მხოლოდ Kere-ის მეშვეობით. შემსრულებელი მომხმარებელს პირდაპირ არ უკავშირდება და მისგან ანაზღაურებას არ იღებს.',
                        'მომხმარებლის უკუკავშირი ეხება Kere-ის მომსახურებას და გამოიყენება ხარისხის კონტროლისა და სერვისის გაუმჯობესებისთვის. შემსრულებლებისთვის საჯარო რეიტინგი ან შეფასება არ იქმნება.',
                    ],
                },
                { type: 'h3', text: '4.3 სხეულის ფოტოები და ზომები' },
                { type: 'p', text: 'კერე სხეულის ზომებსა და ფოტოებს ამუშავებს მხოლოდ ინდივიდუალური სამოსის მორგებისა და შეკვეთის შესრულების მიზნით. მათი მიწოდება მოითხოვება მხოლოდ მაშინ, როდესაც კონკრეტული სერვისისთვის ეს აუცილებელია. კერე ამ მასალას არ იყენებს პირის ბიომეტრიული იდენტიფიკაციისთვის, ჯანმრთელობის დიაგნოსტირებისთვის ან მომხმარებლისთვის სამართლებრივი შედეგის მქონე პროფაილინგისთვის.' },
            ],
        },
        {
            id: 'section-5',
            title: '5 მონაცემების წყაროები',
            blocks: [
                { type: 'p', text: 'მონაცემებს ვიღებთ:' },
                {
                    type: 'ul',
                    items: [
                        'უშუალოდ თქვენგან, როდესაც რეგისტრირდებით, ქმნით პროფილს, ათავსებთ შეკვეთას, ატვირთავთ ფაილს, ავსებთ ზომებს ან გვიკავშირდებით;',
                        'მკერავი სპეციალისტისგან, როდესაც იგი ანახლებს შეკვეთის სტატუსს ან გვაწვდის შესრულებასთან დაკავშირებულ ინფორმაციას;',
                        'საგადახდო პროვაიდერისა და ბანკისგან, გადახდის სტატუსისა და ტრანზაქციის შეზღუდული მონაცემების სახით;',
                        'კურიერისგან, მიწოდების სტატუსისა და შემთხვევის შესახებ;',
                        'ავტომატურად, ვებგვერდის ან აპლიკაციის გამოყენებისას აუცილებელი ტექნიკური ჩანაწერებისა და ქუქი ტექნოლოგიების მეშვეობით.',
                    ],
                },
            ],
        },
        {
            id: 'section-6',
            title: '6 რატომ და რა საფუძვლით ვამუშავებთ მონაცემებს',
            blocks: [
                {
                    type: 'table',
                    head: ['მიზანი', 'მონაცემები', 'სამართლებრივი საფუძველი'],
                    rows: [
                        ['ანგარიშის შექმნა და მართვა', 'საკონტაქტო, ასაკის, ანგარიშისა და ვერიფიკაციის მონაცემები', 'ხელშეკრულების დადება/შესრულება; თანხმობა, როდესაც ის აუცილებელია'],
                        ['შეკვეთის შექმნა, ფასის შეთანხმება და შესრულება', 'ზომები, ფოტოები, დიზაინი, შეკვეთის სპეციფიკაცია, ჩათი', 'ხელშეკრულების დადება და შესრულება'],
                        ['შემსრულებლისთვის შეკვეთის შიდა განაწილება და შესრულების ორგანიზება', 'შემსრულებლის სახელი, კონტაქტი, კვალიფიკაცია, სპეციალიზაცია, გამოცდილება და დატვირთვა; შეკვეთის შესრულებისთვის აუცილებელი მომხმარებლის სახელი, ზომები, დიზაინი და ტექნიკური დეტალები; Kere-სა და შემსრულებელს შორის სამუშაო კომუნიკაცია', 'ხელშეკრულების შესრულება; Kere-ის ლეგიტიმური ინტერესი'],
                        ['Kere-სთვის მომხმარებლის გადახდა, შემსრულებელთან შიდა ანგარიშსწორება და აღრიცხვა', 'ტრანზაქციის, საბანკო და შეკვეთის ინფორმაცია', 'ხელშეკრულება; სამართლებრივი ვალდებულება'],
                        ['მიწოდება', 'მიმღების სახელი, ტელეფონი, მისამართი და შეკვეთის შეზღუდული დეტალები', 'ხელშეკრულების შესრულება'],
                        ['დავების, დაბრუნებებისა და ხარისხის საკითხების მართვა', 'შეკვეთა, ჩათი, ფოტოები, საჩივარი და მტკიცებულებები', 'ხელშეკრულება; სამართლებრივი მოთხოვნის დაცვა; ლეგიტიმური ინტერესი'],
                        ['უსაფრთხოება, თაღლითობისა და წესების დარღვევის პრევენცია', 'ტექნიკური ჩანაწერები, ჩათი, ტრანზაქციისა და ანგარიშის მოქმედებები', 'ლეგიტიმური ინტერესი; სამართლებრივი ვალდებულება'],
                        ['Kere-ის მომსახურების ხარისხის კონტროლი და გაუმჯობესება', 'დეპერსონალიზებული ან აგრეგირებული გამოყენების ინფორმაცია და Kere-ის მომსახურებაზე მომხმარებლის უკუკავშირი; შემსრულებლებისთვის საჯარო რეიტინგი ან შეფასება არ იქმნება', 'ლეგიტიმური ინტერესი'],
                        ['პირდაპირი მარკეტინგი', 'სახელი, ელფოსტა, ტელეფონი და თანხმობის ჩანაწერი', 'წინასწარი თანხმობა'],
                    ],
                },
            ],
        },
        {
            id: 'section-7',
            title: '7 რომელი მონაცემებია სავალდებულო',
            blocks: [
                { type: 'p', text: 'რეგისტრაციისთვის აუცილებელია იმ ველების შევსება, რომლებიც შესაბამის ფორმაში სავალდებულოდ არის მონიშნული. შეკვეთის შესასრულებლად საჭიროა შეკვეთის აღწერა, შესაბამისი ზომები, საბოლოო ფასის დადასტურება და გადახდისთვის აუცილებელი ინფორმაცია. სავალდებულო მონაცემების მიუწოდებლობის შემთხვევაში შესაძლოა ვერ შევქმნათ ანგარიში, ვერ მივიღოთ შეკვეთა ან ვერ შევასრულოთ მომსახურება. არასავალდებულო ფოტოებისა და მარკეტინგული თანხმობის არმიცემა ძირითად მომსახურებაზე წვდომას არ ზღუდავს.' },
            ],
        },
        {
            id: 'section-8',
            title: '8 მონაცემების გაზიარება და მიმღებები',
            blocks: [
                { type: 'p', text: 'კერე პერსონალურ მონაცემებს არ ყიდის. მონაცემებს მხოლოდ აუცილებელი მოცულობით ვუზიარებთ შემდეგ კატეგორიებს:' },
                { type: 'h3', text: '8.1 მკერავი სპეციალისტები და ატელიეები' },
                { type: 'p', text: 'შეკვეთის შესრულების მიზნით Kere-ის მიერ შერჩეულ და მასთან სახელშეკრულებო ურთიერთობაში მყოფ შემსრულებელს შეიძლება გადაეცეს მხოლოდ აუცილებელი ინფორმაცია: მომხმარებლის სახელი, ზომები, დიზაინი, შერჩეული მასალა, შეკვეთის ტექნიკური მოთხოვნები და ვადა. შემსრულებელი ვალდებულია მიღებული მონაცემები გამოიყენოს მხოლოდ კონკრეტული შეკვეთის შესრულების მიზნით, დაიცვას მათი კონფიდენციალურობა და უსაფრთხოება. შემსრულებელს არ გადაეცემა მომხმარებლის ტელეფონის ნომერი, პირადი ელფოსტა ან მიწოდების მისამართი. შემსრულებელი მომხმარებელს პირდაპირ არ უკავშირდება, მისგან ანაზღაურებას არ იღებს და მონაცემებს არ იყენებს საკუთარი მარკეტინგისთვის. შეკვეთასთან დაკავშირებული კომუნიკაცია და გადახდა ხორციელდება მხოლოდ Kere-ის მეშვეობით. შემსრულებელს ეკრძალება მონაცემების მესამე პირისთვის გადაცემა, გარდა კანონით ან Kere-სთან წინასწარ შეთანხმებული შეკვეთის შესრულებით პირდაპირ გათვალისწინებული შემთხვევისა.' },
                { type: 'h3', text: '8.2 საგადახდო პროვაიდერები და ბანკები' },
                { type: 'p', text: 'გადახდები მუშავდება Kere-ის მიერ შერჩეული დამოუკიდებელი საგადახდო მომსახურების მიმწოდებლისა და მომსახურებაში ჩართული ბანკის დაცულ გარემოში. კერე იღებს მხოლოდ გადახდის დასადასტურებლად და ანგარიშსწორებისთვის საჭირო შეზღუდულ ინფორმაციას. სრულ საბარათე ნომერს, მოქმედების ვადასა და CVV/CVC კოდს კერე არ ინახავს. მოქმედი საგადახდო მომსახურების მიმწოდებლის შესახებ ინფორმაცია ხელმისაწვდომია გადახდის გვერდზე ან მოთხოვნის შემთხვევაში ამ პოლიტიკაში მითითებული ელფოსტით.' },
                { type: 'h3', text: '8.3 მიწოდების მომსახურება' },
                { type: 'p', text: 'მიწოდებისთვის კურიერს შეიძლება გადაეცეს მიმღების სახელი, ტელეფონი, მისამართი, მიწოდების ინსტრუქცია და ამანათის შესახებ აუცილებელი ინფორმაცია.' },
                { type: 'h3', text: '8.4 ტექნიკური მომსახურების მომწოდებლები' },
                { type: 'p', text: 'Kere შეიძლება იყენებდეს ჰოსტინგის, მონაცემთა შენახვის, ელფოსტის/SMS-ის, კიბერუსაფრთხოების, მომხმარებელთა მხარდაჭერისა და პროგრამული უზრუნველყოფის მომწოდებლებს. ასეთ პირებს მონაცემებზე წვდომა აქვთ მხოლოდ კერეს დავალებით, მომსახურების აუცილებელ ფარგლებში და კონფიდენციალურობისა და უსაფრთხოების შესაბამისი ვალდებულებების დაცვით.' },
                { type: 'h3', text: '8.5 კანონით გათვალისწინებული პირები' },
                { type: 'p', text: 'მონაცემები შეიძლება გადაეცეს სასამართლოს, სახელმწიფო აუდიტის სამსახურს, სამართალდამცავ, საგადასახადო ან სხვა უფლებამოსილ ორგანოს, როდესაც ამას კანონი მოითხოვს ან ეს აუცილებელია კერესა და სხვა პირთა სამართლებრივი უფლებების დასაცავად.' },
            ],
        },
        {
            id: 'section-9',
            title: '9 პლატფორმის ჩათი და მისი მონიტორინგი',
            blocks: [
                { type: 'p', text: 'პლატფორმის ჩათი გამოიყენება მომხმარებელსა და Kere-ს შორის კომუნიკაციისთვის. შემსრულებელი მომხმარებელს პირდაპირ არ უკავშირდება. კერე უფლებამოსილია ავტომატურად ან უფლებამოსილი თანამშრომლის მეშვეობით შეამოწმოს პლატფორმის ჩათში გაცვლილი შეტყობინებები შემდეგი მიზნებისთვის:' },
                {
                    type: 'ul',
                    items: [
                        'მომხმარებლებისა და მკერავი სპეციალისტების უსაფრთხოების დაცვა;',
                        'თაღლითობის, შევიწროების და უკანონო შინაარსის გამოვლენა;',
                        'საჩივრის ან დავის განხილვა და შეკვეთის პირობების დადასტურება;',
                        'კერეს წესებისა და სამართლებრივი ვალდებულებების შესრულება.',
                    ],
                },
                { type: 'p', text: 'ჩათზე წვდომა აქვთ მხოლოდ შესაბამისი უფლებამოსილების მქონე პირებს. მონიტორინგის საფუძველია მომსახურების ხელშეკრულების შესრულება და კერეს ლეგიტიმური ინტერესი უსაფრთხო პლატფორმის ფუნქციონირებაში.' },
                { type: 'p', text: 'ჩათში არ გააზიაროთ:' },
                {
                    type: 'ul',
                    items: [
                        'პირადი ტელეფონის ნომერი ან პირადი ელფოსტა;',
                        'სოციალური ქსელის პროფილი;',
                        'საცხოვრებელი ან სამუშაო მისამართი, თუ ეს კერეს შესაბამის ფორმაში არ მოითხოვება;',
                        'პირადი ნომერი, პასპორტი, პირადობის მოწმობა ან მათი ფოტო;',
                        'საბანკო ანგარიში, ბარათის ნომერი, CVV/CVC, პაროლი ან ერთჯერადი კოდი;',
                        'ჯანმრთელობის, ოჯახის ან სხვა პირადი ინფორმაცია, რომელიც შეკვეთისთვის აუცილებელი არ არის.',
                    ],
                },
                { type: 'p', text: 'კერე არასდროს მოგთხოვთ ჩათში ბარათის სრულ მონაცემებს, პაროლს ან ერთჯერად კოდს.' },
            ],
        },
        {
            id: 'section-10',
            title: '10 ქუქი ფაილები და მსგავსი ტექნოლოგიები',
            blocks: [
                { type: 'p', text: 'Kere ამ ეტაპზე იყენებს მხოლოდ პლატფორმის ფუნქციონირებისთვის აუცილებელ ქუქი ფაილებსა და მსგავს ტექნიკურ ჩანაწერებს. ისინი საჭიროა ანგარიშში უსაფრთხო შესვლის, სესიის შენარჩუნების, უსაფრთხოების, თაღლითობის პრევენციისა და მომხმარებლის მიერ მოთხოვნილი ფუნქციების უზრუნველსაყოფად. მათი გამორთვა ბრაუზერის პარამეტრებიდან შესაძლებელია, თუმცა ამან შეიძლება პლატფორმის ზოგიერთი ფუნქციის მუშაობა შეზღუდოს.' },
                { type: 'p', text: 'ამ ეტაპზე Kere არ იყენებს ანალიტიკურ, სარეკლამო ან ქცევაზე დაფუძნებული თვალთვალის ქუქი ფაილებს. თუ მომავალში ასეთი ტექნოლოგიები დაემატება, ისინი არ გააქტიურდება მომხმარებლის წინასწარი თანხმობის გარეშე. მომხმარებელს ექნება შესაძლებლობა თანხმობა გასცეს, უარი თქვას ან შემდგომ გამოიხმოს იგი ქუქიების შეტყობინებიდან ან შესაბამისი პარამეტრებიდან. პოლიტიკა განახლდება ასეთი ტექნოლოგიის ამოქმედებამდე.' },
            ],
        },
        {
            id: 'section-11',
            title: '11 არასრულწლოვანთა მონაცემები',
            blocks: [
                { type: 'p', text: '16 წლამდე პირს კერეზე რეგისტრაცია და მომსახურებით დამოუკიდებლად სარგებლობა არ შეუძლია. 16–17 წლის მომხმარებლის რეგისტრაცია დასაშვებია მხოლოდ მშობლის ან სხვა კანონიერი წარმომადგენლის ელექტრონული თანხმობით. კერე უფლებამოსილია მიიღოს გონივრული ზომები წარმომადგენლის ვინაობისა და თანხმობის ნამდვილობის დასადასტურებლად.' },
                { type: 'p', text: 'არასრულწლოვანის მონაცემები მუშავდება მისი საუკეთესო ინტერესების გათვალისწინებით. კერე არ იყენებს არასრულწლოვანის მონაცემებს ქცევაზე დაფუძნებული მარკეტინგისთვის. თუ გამოვლინდა, რომ ანგარიში მოთხოვნების დარღვევით შეიქმნა, კერე უფლებამოსილია შეზღუდოს ანგარიში და წაშალოს მონაცემები, თუ მათი შენახვა კანონით ან დავის მართვისთვის აუცილებელი არ არის.' },
            ],
        },
        {
            id: 'section-12',
            title: '12 მონაცემების საერთაშორისო გადაცემა',
            blocks: [
                { type: 'p', text: 'Kere-ის ზოგიერთი ტექნიკური მომსახურების მომწოდებელი ან მისი სერვერი შეიძლება მდებარეობდეს საქართველოს ფარგლებს გარეთ. ასეთ შემთხვევაში Kere მონაცემებს გადასცემს მხოლოდ კანონით დაშვებული საფუძვლით და შესაბამისი დაცვის გარანტიების გამოყენებით, მათ შორის, ხელშეკრულებით განსაზღვრული კონფიდენციალურობისა და უსაფრთხოების ვალდებულებებით, სათანადო დაცვის მქონე სახელმწიფოში გადაცემით ან საჭირო ნებართვის/თანხმობის საფუძველზე. მოქმედი ტექნიკური მომწოდებლებისა და გადაცემის შესაბამისი გარანტიების შესახებ ინფორმაციის მოთხოვნა შეგიძლიათ ამ პოლიტიკაში მითითებულ ელფოსტაზე.' },
            ],
        },
        {
            id: 'section-13',
            title: '13 მონაცემების შენახვის ვადები',
            blocks: [
                {
                    type: 'table',
                    head: ['მონაცემის კატეგორია', 'შენახვის ვადა ან კრიტერიუმი'],
                    rows: [
                        ['ანგარიშისა და საკონტაქტო მონაცემები', 'ანგარიშის მოქმედების განმავლობაში და მისი დახურვიდან 5 წელი, თუ უფრო ხანგრძლივი შენახვა კანონით არ მოითხოვება'],
                        ['შეკვეთა, დიზაინი, კომუნიკაცია და დავის მასალები', 'შეკვეთის დასრულებიდან ან ურთიერთობის შეწყვეტიდან 5 წელი; მიმდინარე დავის შემთხვევაში — დავის საბოლოო დასრულებამდე'],
                        ['შეკვეთაში მითითებული ზომები და სხეულის ფოტოები', 'აქტიური შეკვეთის განმავლობაში და მისი დასრულებიდან 90 დღე. საჩივრის, დაბრუნების, გადახდის დავის ან სხვა სამართლებრივი მოთხოვნის შემთხვევაში შესაბამისი მასალა შეიძლება შენარჩუნდეს საკითხის საბოლოო დასრულებამდე და კანონით დასაშვები ვადით'],
                        ['ტრანზაქციისა და საბუღალტრო ჩანაწერები', 'საქართველოს კანონმდებლობით განსაზღვრული სავალდებულო ვადით'],
                        ['დაუსრულებელი რეგისტრაცია და ერთჯერადი ვერიფიკაციის მონაცემები', 'არაუმეტეს 90 დღისა, გარდა უსაფრთხოების ინციდენტთან დაკავშირებული შემთხვევისა'],
                        ['უსაფრთხოების და სისტემური ჩანაწერები', 'ჩვეულებრივ, არაუმეტეს 24 თვისა; ინციდენტის შემთხვევაში — გამოძიებისა და სამართლებრივი მოთხოვნისთვის საჭირო ვადით'],
                        ['პროფილში შენახული ზომები', 'სანამ მომხმარებელი მათ პროფილიდან არ წაშლის ან ანგარიში არ დაიხურება'],
                        ['მარკეტინგული თანხმობის/უარის ჩანაწერები', 'მარკეტინგის განხორციელების პერიოდში და მისი შეწყვეტიდან 1 წელი'],
                    ],
                },
                { type: 'p', text: 'ვადის გასვლის შემდეგ მონაცემები იშლება, ნადგურდება ან დეპერსონალიზდება, თუ მათი შემდგომი შენახვა კანონით, სამართლებრივი მოთხოვნის დასაცავად ან უსაფრთხოების ინციდენტის სამართავად აუცილებელი არ არის.' },
            ],
        },
        {
            id: 'section-14',
            title: '14 მონაცემთა უსაფრთხოება',
            blocks: [
                { type: 'p', text: 'კერე იყენებს მონაცემთა ხასიათისა და არსებული რისკების შესაბამის ტექნიკურ და ორგანიზაციულ ზომებს. ასეთი ზომები შეიძლება მოიცავდეს:' },
                {
                    type: 'ul',
                    items: [
                        'მონაცემებზე წვდომის მინიჭებას მხოლოდ სამუშაო საჭიროებისა და უფლებამოსილების ფარგლებში;',
                        'სისტემურ მოქმედებათა და წვდომის აღრიცხვას;',
                        'დაცული საკომუნიკაციო არხებისა და პაროლების უსაფრთხო მართვას;',
                        'მონაცემთა სარეზერვო ასლებს, განახლებებსა და უსაფრთხოების პერიოდულ შეფასებას;',
                        'თანამშრომლებისა და პარტნიორების კონფიდენციალურობის ვალდებულებებს;',
                        'ინციდენტზე რეაგირების პროცედურებს.',
                    ],
                },
                { type: 'p', text: 'არცერთი ელექტრონული სისტემა არ არის აბსოლუტურად უსაფრთხო. უსაფრთხოების საეჭვო შემთხვევის შესახებ დაუყოვნებლივ მოგვწერეთ ამ პოლიტიკაში მითითებულ ელფოსტაზე.' },
            ],
        },
        {
            id: 'section-15',
            title: '15 მონაცემთა უსაფრთხოების ინციდენტი',
            blocks: [
                { type: 'p', text: 'კერე აღრიცხავს მონაცემთა უსაფრთხოების ინციდენტებს და იღებს ზომებს ზიანის შესამცირებლად. კანონით გათვალისწინებულ შემთხვევაში კერე ინციდენტის აღმოჩენიდან არაუგვიანეს 72 საათისა შეატყობინებს საქართველოს სახელმწიფო აუდიტის სამსახურს. თუ ინციდენტი მაღალი ალბათობით მნიშვნელოვან ზიანს ან საფრთხეს უქმნის მომხმარებლის უფლებებს, კერე მომხმარებელსაც მიაწვდის მარტივ და გასაგებ ინფორმაციას ინციდენტისა და დაცვის ღონისძიებების შესახებ.' },
            ],
        },
        {
            id: 'section-16',
            title: '16 თქვენი უფლებები',
            blocks: [
                { type: 'p', text: 'საქართველოს კანონმდებლობის შესაბამისად თქვენ გაქვთ უფლება:' },
                {
                    type: 'ul',
                    items: [
                        'მიიღოთ დადასტურება, მუშავდება თუ არა თქვენი მონაცემები და მიიღოთ ინფორმაცია დამუშავების შესახებ;',
                        'გაეცნოთ თქვენს მონაცემებს და უსასყიდლოდ მიიღოთ მათი ასლი;',
                        'მოითხოვოთ მცდარი, არაზუსტი ან არასრული მონაცემის გასწორება, განახლება ან შევსება;',
                        'მოითხოვოთ მონაცემთა დამუშავების შეწყვეტა, წაშლა, განადგურება ან დაბლოკვა, თუ არ არსებობს მათი შენახვის სხვა კანონიერი საფუძველი;',
                        'გამოიხმოთ თანხმობა იმავე სიმარტივით, რა ფორმითაც იგი გაიცა;',
                        'უარი თქვათ პირდაპირ მარკეტინგზე;',
                        'კანონით გათვალისწინებულ შემთხვევაში მოითხოვოთ მონაცემების სტრუქტურირებული ფორმით მიღება ან სხვა პასუხისმგებელი პირისთვის გადაცემა;',
                        'მიიღოთ ინფორმაცია სრულად ავტომატიზებული გადაწყვეტილებისა და გამოყენებული ლოგიკის შესახებ, თუ ასეთი დამუშავება განხორციელდება;',
                        'გაასაჩივროთ კერეს მოქმედება ან გადაწყვეტილება საქართველოს სახელმწიფო აუდიტის სამსახურში ან სასამართლოში.',
                    ],
                },
                { type: 'p', text: 'უფლების განსახორციელებლად მოგვწერეთ ამ პოლიტიკაში მითითებულ ელფოსტაზე. მოთხოვნის დამუშავებამდე შესაძლოა მოგთხოვოთ ვინაობის გონივრული დადასტურება. კერე მოთხოვნას განიხილავს კანონით დადგენილ ვადაში, ჩვეულებრივ, არაუგვიანეს 10 სამუშაო დღისა. განსაკუთრებულ შემთხვევაში ვადა შეიძლება გაგრძელდეს დამატებით არაუმეტეს 10 სამუშაო დღით, რის შესახებაც შეგატყობინებთ.' },
            ],
        },
        {
            id: 'section-17',
            title: '17 პირდაპირი მარკეტინგი',
            blocks: [
                { type: 'p', text: 'სარეკლამო ან შეთავაზების შემცველ ელფოსტას, SMS-ს ან სხვა პირდაპირ შეტყობინებას გამოგიგზავნით მხოლოდ წინასწარი თანხმობის საფუძველზე. თანხმობის გამოხმობა შეგიძლიათ შეტყობინებაში მითითებული საშუალებით ან კერესთან დაკავშირებით. უარის თქმა უფასოა და არ ზღუდავს ძირითად მომსახურებას. მოთხოვნის მიღების შემდეგ პირდაპირი მარკეტინგის მიზნით დამუშავება შეწყდება გონივრულ ვადაში, მაგრამ არაუგვიანეს 7 სამუშაო დღისა.' },
            ],
        },
        {
            id: 'section-18',
            title: '18 ავტომატიზებული დამუშავება და ხელოვნური ინტელექტი',
            blocks: [
                { type: 'p', text: 'ამ პოლიტიკის ძალაში შესვლის თარიღისთვის კერე არ იღებს მომხმარებლისთვის სამართლებრივი, ფინანსური ან სხვა არსებითი შედეგის მქონე გადაწყვეტილებას მხოლოდ ავტომატიზებული დამუშავების საფუძველზე. თუ მომავალში დაემატება ფოტოებიდან ზომების განსაზღვრის, დიზაინის რეკომენდაციის ან სხვა AI ფუნქცია, კერე ფუნქციის გამოყენებამდე მომხმარებელს მიაწვდის ინფორმაციას მონაცემების, მიზნის, მიმღების, შესაძლო საერთაშორისო გადაცემისა და შენახვის შესახებ და მიიღებს თანხმობას, როდესაც ეს კანონით აუცილებელია.' },
            ],
        },
        {
            id: 'section-19',
            title: '19 პოლიტიკის ცვლილება',
            blocks: [
                { type: 'p', text: 'Kere პერიოდულად განაახლებს ამ პოლიტიკას მომსახურების, ტექნოლოგიის ან კანონმდებლობის ცვლილების შესაბამისად. განახლებული ვერსია გამოქვეყნდება ვებგვერდზე და მიეთითება ბოლო განახლების თარიღი. არსებითი ცვლილების შემთხვევაში მომხმარებელს დამატებით ეცნობება აპლიკაციით, ელფოსტით ან სხვა შესაბამისი საშუალებით, ცვლილების ძალაში შესვლამდე.' },
            ],
        },
        {
            id: 'section-20',
            title: '20 საჩივარი, საკონტაქტო ინფორმაცია და მოქმედი სამართალი',
            blocks: [
                { type: 'p', text: 'თუ გაქვთ შეკითხვა, მოთხოვნა ან საჩივარი თქვენი მონაცემების დამუშავებასთან დაკავშირებით, პირველ რიგში მოგვწერეთ: kereforyou@gmail.com' },
                { type: 'p', text: 'თქვენ ასევე გაქვთ უფლება მიმართოთ საქართველოს სახელმწიფო აუდიტის სამსახურს ან სასამართლოს საქართველოს კანონმდებლობით დადგენილი წესით.' },
                { type: 'p', text: 'ეს პოლიტიკა რეგულირდება საქართველოს კანონმდებლობით, მათ შორის, საქართველოს კანონით „პერსონალურ მონაცემთა დაცვის შესახებ“. პოლიტიკის სხვა ენაზე თარგმნის შემთხვევაში, წინააღმდეგობისას უპირატესობა ენიჭება ქართულ ვერსიას.' },
            ],
        },
    ],
};

const en: LegalDocument = {
    title: 'Personal Data Protection and Privacy Policy',
    lead: 'Applies to the KereForYou website, app and related services.',
    meta: [
        { label: 'Version', value: '1.2' },
        { label: 'Effective date', value: '20 September 2026' },
        { label: 'Last updated', value: '26 October 2026' },
    ],
    note: 'This is an English translation of the Georgian original. If the two differ, the Georgian version prevails (see section 20).',
    summary: 'This policy explains how KereForYou LLC (შპს „კერე შენთვის“) collects, uses, stores, shares and protects personal data, and how data subjects can exercise their rights. Kere processes only the data needed to create an account, accept and fulfil an individual order, take payment, deliver, keep the platform secure and meet its legal obligations.',
    sections: [
        {
            id: 'overview',
            title: 'At a glance',
            blocks: [
                {
                    type: 'ul',
                    items: [
                        'The performer Kere selects receives only the information needed to fulfil the order; communication with the customer and payment from the customer go only through Kere.',
                        "The customer enters full card details directly in the payment provider's secure environment; Kere does not store the full card number, the expiry date or the CVV/CVC code.",
                        'For safety, dispute resolution and enforcement of the platform rules, Kere may check the messages exchanged in the platform chat.',
                        'A person under 16 cannot register on Kere. A person aged 16–17 may register with the electronic consent of a parent or other legal representative.',
                    ],
                },
            ],
        },
        {
            id: 'section-1',
            title: '1 Who we are and how to contact us',
            blocks: [
                { type: 'p', text: 'The party responsible for processing personal data is:' },
                {
                    type: 'ul',
                    items: [
                        'Name: KereForYou LLC (შპს „კერე შენთვის“)',
                        'Identification code: 406562376',
                        'Website: https://kereforyou.com/',
                        'Personal data enquiries: kereforyou@gmail.com',
                    ],
                },
                { type: 'p', text: 'You can send requests about your data, this policy or data security to this email address.' },
            ],
        },
        {
            id: 'section-2',
            title: '2 Who and what this policy covers',
            blocks: [
                { type: 'p', text: 'This policy applies to:' },
                {
                    type: 'ul',
                    items: [
                        'Kere customers and website visitors;',
                        "Kere's tailoring specialists, ateliers and their authorised representatives;",
                        'parents or legal representatives who give consent for a customer aged 16–17;',
                        'people who contact us by chat, email, phone or another support channel.',
                    ],
                },
                { type: 'p', text: 'Payment providers, banks, couriers and other independent organisations may also process data under their own privacy policies. Processing they carry out independently is governed by their own terms.' },
            ],
        },
        {
            id: 'section-3',
            title: '3 Core principles of data processing',
            blocks: [
                { type: 'p', text: 'Kere processes data lawfully, fairly and transparently. Data is collected for specific purposes and only to the extent necessary, is kept only as long as needed and is protected by appropriate technical and organisational measures. Kere periodically reviews the accuracy of data, access rights and the need to keep data.' },
            ],
        },
        {
            id: 'section-4',
            title: '4 What data we process',
            blocks: [
                { type: 'h3', text: '4.1 Customer data' },
                {
                    type: 'ul',
                    items: [
                        'identification and contact details: first name, last name, date of birth, phone and email;',
                        'account data: registration, sign-in and verification records;',
                        'individual measurements and fitting information;',
                        'photos, designs, sketches, files and other material uploaded by the customer;',
                        'order information: garment category, model, fabric, colour, details, preferred price range, final price, timeframe and order status;',
                        "delivery information: the recipient's name, phone, address and delivery instructions;",
                        'limited transaction information: amount, currency, payment status, date, and order and transaction identifiers;',
                        "communications: the platform chat between the customer and Kere, support requests, complaints, dispute evidence and feedback on Kere's service;",
                        'technical data: IP address, device and browser type, and session, security and system activity records.',
                    ],
                },
                { type: 'h3', text: '4.2 The status of performers and their data' },
                {
                    type: 'ul',
                    items: [
                        'Tailoring specialists and ateliers are performers selected by Kere and under contract with it.',
                        "Their name, contact details, qualifications, specialisation, experience and workload are processed for Kere's internal purposes: allocating orders, quality control and organising the work. This information is not published and does not give the customer a way to choose a performer.",
                        "Kere also processes business or legal registration information, where necessary a document proving authority to represent, bank account and settlement information, the internal price estimates submitted to Kere, and records of accepted and completed orders, timeframes and quality control. This data is used only for Kere's internal contractual relationship, settlements and the related legal obligations. Performers are paid under Kere's internal contractual arrangements. The customer is not a party to those payments and pays only Kere.",
                        "A performer's communication data covers only what is exchanged with Kere while organising and carrying out the work. For consistent service quality, customer safety and the proper management of orders, communication and payment relating to an order take place only through Kere. The performer does not contact the customer directly and does not accept payment from them.",
                        "Customer feedback concerns Kere's service and is used for quality control and to improve the service. No public rating or review of performers is created.",
                    ],
                },
                { type: 'h3', text: '4.3 Body photos and measurements' },
                { type: 'p', text: 'Kere processes body measurements and photos only to fit individual clothing and fulfil orders. They are requested only when a specific service requires them. Kere does not use this material for biometric identification, health diagnosis or profiling that produces legal effects for the customer.' },
            ],
        },
        {
            id: 'section-5',
            title: '5 Sources of data',
            blocks: [
                { type: 'p', text: 'We receive data:' },
                {
                    type: 'ul',
                    items: [
                        'directly from you, when you register, create a profile, place an order, upload a file, fill in measurements or contact us;',
                        "from the tailoring specialist, when they update an order's status or provide information about its fulfilment;",
                        'from the payment provider and the bank, in the form of the payment status and limited transaction data;',
                        'from the courier, about the delivery status and any incident;',
                        'automatically, through the technical records and cookie technologies needed when you use the website or app.',
                    ],
                },
            ],
        },
        {
            id: 'section-6',
            title: '6 Why and on what basis we process data',
            blocks: [
                {
                    type: 'table',
                    head: ['Purpose', 'Data', 'Legal basis'],
                    rows: [
                        ['Creating and managing an account', 'Contact, age, account and verification data', 'Concluding/performing a contract; consent, where it is required'],
                        ['Creating an order, agreeing the price and fulfilling the order', 'Measurements, photos, design, order specification, chat', 'Concluding and performing a contract'],
                        ['Allocating orders to performers internally and organising the work', "The performer's name, contact details, qualifications, specialisation, experience and workload; the customer's name, measurements, design and technical details needed to fulfil the order; working communication between Kere and the performer", "Performing a contract; Kere's legitimate interest"],
                        ["The customer's payment to Kere, internal settlement with performers and accounting", 'Transaction, bank and order information', 'Contract; legal obligation'],
                        ['Delivery', "Recipient's name, phone, address and limited order details", 'Performing a contract'],
                        ['Managing disputes, returns and quality issues', 'Order, chat, photos, complaint and evidence', 'Contract; defence of legal claims; legitimate interest'],
                        ['Security and prevention of fraud and rule breaches', 'Technical records, chat, transaction and account activity', 'Legitimate interest; legal obligation'],
                        ["Quality control and improvement of Kere's service", "De-identified or aggregated usage information and customer feedback on Kere's service; no public rating or review of performers is created", 'Legitimate interest'],
                        ['Direct marketing', 'Name, email, phone and consent record', 'Prior consent'],
                    ],
                },
            ],
        },
        {
            id: 'section-7',
            title: '7 Which data is mandatory',
            blocks: [
                { type: 'p', text: 'To register, you must fill in the fields marked as mandatory in the relevant form. To fulfil an order, we need the order description, the relevant measurements, confirmation of the final price and the information needed for payment. If mandatory data is not provided, we may be unable to create an account, accept an order or provide the service. Not giving optional photos or marketing consent does not restrict access to the core service.' },
            ],
        },
        {
            id: 'section-8',
            title: '8 Data sharing and recipients',
            blocks: [
                { type: 'p', text: 'Kere does not sell personal data. We share data, only to the extent necessary, with the following categories of recipients:' },
                { type: 'h3', text: '8.1 Tailoring specialists and ateliers' },
                { type: 'p', text: "To fulfil an order, the performer selected by Kere and under contract with it may receive only the information needed: the customer's name, measurements, design, chosen material, the order's technical requirements and the deadline. The performer must use the data received only to fulfil the specific order and must keep it confidential and secure. The performer does not receive the customer's phone number, personal email or delivery address. The performer does not contact the customer directly, does not accept payment from them and does not use the data for their own marketing. Communication and payment relating to an order take place only through Kere. The performer may not pass the data to third parties, except where the law, or the fulfilment of an order agreed in advance with Kere, expressly provides for it." },
                { type: 'h3', text: '8.2 Payment providers and banks' },
                { type: 'p', text: 'Payments are processed in the secure environment of an independent payment service provider selected by Kere and of the bank involved in the service. Kere receives only the limited information needed to confirm the payment and to settle accounts. Kere does not store the full card number, the expiry date or the CVV/CVC code. Information about the current payment service provider is available on the payment page, or on request at the email address given in this policy.' },
                { type: 'h3', text: '8.3 Delivery services' },
                { type: 'p', text: "For delivery, the courier may receive the recipient's name, phone, address, delivery instructions and the necessary information about the parcel." },
                { type: 'h3', text: '8.4 Technical service providers' },
                { type: 'p', text: "Kere may use providers of hosting, data storage, email/SMS, cybersecurity, customer support and software. Such providers have access to data only on Kere's instructions, to the extent the service requires, and subject to appropriate confidentiality and security obligations." },
                { type: 'h3', text: '8.5 Parties provided for by law' },
                { type: 'p', text: 'Data may be disclosed to a court, the State Audit Office, law enforcement, tax or other competent authorities when the law requires it or when this is necessary to protect the legal rights of Kere and others.' },
            ],
        },
        {
            id: 'section-9',
            title: '9 Platform chat and its monitoring',
            blocks: [
                { type: 'p', text: 'The platform chat is used for communication between the customer and Kere. The performer does not contact the customer directly. Kere may check the messages exchanged in the platform chat, automatically or through an authorised employee, for the following purposes:' },
                {
                    type: 'ul',
                    items: [
                        'protecting the safety of customers and tailoring specialists;',
                        'detecting fraud, harassment and unlawful content;',
                        'reviewing a complaint or dispute and confirming the terms of an order;',
                        "enforcing Kere's rules and meeting legal obligations.",
                    ],
                },
                { type: 'p', text: "Only persons with the appropriate authorisation have access to the chat. The basis for monitoring is the performance of the service contract and Kere's legitimate interest in operating a safe platform." },
                { type: 'p', text: 'Do not share in the chat:' },
                {
                    type: 'ul',
                    items: [
                        'a personal phone number or personal email;',
                        'a social media profile;',
                        "a home or work address, unless Kere's relevant form asks for it;",
                        'a personal ID number, passport, ID card or a photo of one;',
                        'a bank account, card number, CVV/CVC, password or one-time code;',
                        'health, family or other personal information that the order does not need.',
                    ],
                },
                { type: 'p', text: 'Kere will never ask you in the chat for full card details, a password or a one-time code.' },
            ],
        },
        {
            id: 'section-10',
            title: '10 Cookies and similar technologies',
            blocks: [
                { type: 'p', text: 'At this stage, Kere uses only the cookies and similar technical records that the platform needs in order to work. They are needed for secure sign-in to the account, keeping the session, security, fraud prevention and providing the features the user asks for. You can turn them off in your browser settings, but this may stop some platform features from working.' },
                { type: 'p', text: "At this stage, Kere does not use analytics, advertising or behaviour-based tracking cookies. If such technologies are added in the future, they will not be activated without the user's prior consent. The user will be able to give consent, refuse it, or later withdraw it from the cookie notice or the relevant settings. The policy will be updated before any such technology is introduced." },
            ],
        },
        {
            id: 'section-11',
            title: '11 Data of minors',
            blocks: [
                { type: 'p', text: "A person under 16 cannot register on Kere or use the service on their own. A customer aged 16–17 may register only with the electronic consent of a parent or other legal representative. Kere may take reasonable steps to verify the representative's identity and the authenticity of the consent." },
                { type: 'p', text: "A minor's data is processed in their best interests. Kere does not use minors' data for behaviour-based marketing. If it emerges that an account was created in breach of these requirements, Kere may restrict the account and delete the data, unless keeping it is required by law or for handling a dispute." },
            ],
        },
        {
            id: 'section-12',
            title: '12 International data transfers',
            blocks: [
                { type: 'p', text: "Some of Kere's technical service providers, or their servers, may be located outside Georgia. In such cases, Kere transfers data only on a basis permitted by law and with appropriate safeguards, including contractual confidentiality and security obligations, transfer to a country with an adequate level of protection, or the necessary authorisation or consent. You can request information about the current technical providers and the relevant transfer safeguards at the email address given in this policy." },
            ],
        },
        {
            id: 'section-13',
            title: '13 Data retention periods',
            blocks: [
                {
                    type: 'table',
                    head: ['Data category', 'Retention period or criterion'],
                    rows: [
                        ['Account and contact data', 'For as long as the account is active and for 5 years after it is closed, unless longer retention is required by law'],
                        ['Orders, designs, communications and dispute materials', '5 years after the order is completed or the relationship ends; in the case of an ongoing dispute, until the dispute is finally resolved'],
                        ['Measurements and body photos given for an order', 'For as long as the order is active and for 90 days after it is completed. In the event of a complaint, return, payment dispute or other legal claim, the relevant material may be kept until the matter is finally resolved and for as long as the law permits'],
                        ['Transaction and accounting records', 'For the mandatory period set by Georgian law'],
                        ['Incomplete registrations and one-time verification data', 'No more than 90 days, except in connection with a security incident'],
                        ['Security and system records', 'Usually no more than 24 months; in the event of an incident, for as long as the investigation and any legal claim require'],
                        ['Measurements saved on the profile', 'Until the customer deletes them from their profile or the account is closed'],
                        ['Marketing consent and refusal records', 'For as long as marketing is carried out and for 1 year after it ends'],
                    ],
                },
                { type: 'p', text: 'When the period expires, data is deleted, destroyed or de-identified, unless keeping it further is necessary under the law, to defend a legal claim or to manage a security incident.' },
            ],
        },
        {
            id: 'section-14',
            title: '14 Data security',
            blocks: [
                { type: 'p', text: 'Kere uses technical and organisational measures that match the nature of the data and the risks involved. These measures may include:' },
                {
                    type: 'ul',
                    items: [
                        'granting access to data only as work requires and within the scope of authority;',
                        'logging system actions and access;',
                        'secure communication channels and secure password management;',
                        'data backups, updates and periodic security assessments;',
                        'confidentiality obligations for employees and partners;',
                        'incident response procedures.',
                    ],
                },
                { type: 'p', text: 'No electronic system is completely secure. If you suspect a security problem, write to us immediately at the email address given in this policy.' },
            ],
        },
        {
            id: 'section-15',
            title: '15 Data security incidents',
            blocks: [
                { type: 'p', text: "Kere records data security incidents and takes measures to reduce harm. Where the law requires, Kere will notify the State Audit Office of Georgia no later than 72 hours after discovering an incident. If an incident is highly likely to cause significant harm or a threat to a customer's rights, Kere will also give the customer simple and clear information about the incident and the protective measures." },
            ],
        },
        {
            id: 'section-16',
            title: '16 Your rights',
            blocks: [
                { type: 'p', text: 'Under Georgian law, you have the right to:' },
                {
                    type: 'ul',
                    items: [
                        'obtain confirmation of whether your data is being processed, and receive information about the processing;',
                        'access your data and receive a copy free of charge;',
                        'request that incorrect, inaccurate or incomplete data be corrected, updated or completed;',
                        'request that processing of your data be stopped, or that the data be deleted, destroyed or blocked, if there is no other lawful basis for keeping it;',
                        'withdraw consent as easily as you gave it;',
                        'object to direct marketing;',
                        'where the law provides, request to receive your data in a structured form or to have it transferred to another controller;',
                        'receive information about a fully automated decision and the logic used, if such processing takes place;',
                        "challenge Kere's actions or decisions before the State Audit Office of Georgia or a court.",
                    ],
                },
                { type: 'p', text: 'To exercise a right, write to us at the email address given in this policy. Before processing the request, we may ask you to confirm your identity in a reasonable way. Kere considers the request within the period set by law, usually no later than 10 working days. In exceptional cases, this period may be extended by no more than a further 10 working days, and we will let you know.' },
            ],
        },
        {
            id: 'section-17',
            title: '17 Direct marketing',
            blocks: [
                { type: 'p', text: 'We send advertising or promotional emails, SMS or other direct messages only with your prior consent. You can withdraw consent by the method given in the message or by contacting Kere. Opting out is free and does not restrict the core service. Once we receive the request, processing for direct marketing stops within a reasonable time, and no later than 7 working days.' },
            ],
        },
        {
            id: 'section-18',
            title: '18 Automated processing and artificial intelligence',
            blocks: [
                { type: 'p', text: 'As of the effective date of this policy, Kere does not make decisions with legal, financial or other significant effects for a customer based solely on automated processing. If an AI feature, such as determining measurements from photos or recommending designs, is added in the future, Kere will, before the feature is used, inform the customer about the data, the purpose, the recipients, any international transfer and retention, and will obtain consent where the law requires it.' },
            ],
        },
        {
            id: 'section-19',
            title: '19 Changes to this policy',
            blocks: [
                { type: 'p', text: 'Kere periodically updates this policy in line with changes to its services, technology or the law. The updated version will be published on the website with the date of the last update. In the event of a material change, customers will also be notified through the app, by email or by another appropriate means before the change takes effect.' },
            ],
        },
        {
            id: 'section-20',
            title: '20 Complaints, contact details and governing law',
            blocks: [
                { type: 'p', text: 'If you have a question, request or complaint about how your data is processed, please write to us first: kereforyou@gmail.com' },
                { type: 'p', text: 'You also have the right to apply to the State Audit Office of Georgia or a court in the manner established by Georgian law.' },
                { type: 'p', text: 'This policy is governed by the laws of Georgia, including the Law of Georgia on Personal Data Protection. If the policy is translated into another language and there is a conflict, the Georgian version prevails.' },
            ],
        },
    ],
};

export const privacyPolicy: Record<'ka' | 'en', LegalDocument> = { ka, en };
