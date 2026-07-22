/**
 * Kere Privacy Policy content, version 2.0 (effective 22 July 2026).
 * Full legal text in Georgian and English, kept here (not in the locale JSON)
 * because it's a large static legal document. PrivacyPolicy.tsx renders the
 * version matching the site's active language.
 */
export type PolicyRow = [string, string];

export type PolicyBlock =
    | { type: 'p'; text: string }
    | { type: 'table'; head: PolicyRow; rows: PolicyRow[] };

export interface PolicySection {
    n: number;
    title: string;
    blocks: PolicyBlock[];
}

export interface PolicyDoc {
    title: string;
    version: string;
    sections: PolicySection[];
}

const ka: PolicyDoc = {
    title: 'კონფიდენციალურობის პოლიტიკა',
    version: 'ვერსია 2.0  •  ძალაშია: 22 ივლისი 2026',
    sections: [
        {
            n: 1,
            title: 'ვინ ვართ ჩვენ',
            blocks: [
                { type: 'p', text: 'შპს „კერე შენთვის“ (საიდენტიფიკაციო ნომერი: 406562376; ინგლისური რეგისტრირებული დასახელება: KereForYou) არის Kere-ს ვებსაიტისა და, შესაბამისი განახლების შემდეგ, მობილური აპლიკაციის ოპერატორი და პერსონალური მონაცემების დამუშავებისთვის პასუხისმგებელი პირი.' },
                { type: 'p', text: 'კონფიდენციალურობის საკითხებზე დაგვიკავშირდით: kereforyou@gmail.com.' },
            ],
        },
        {
            n: 2,
            title: 'პოლიტიკის მოქმედების სფერო',
            blocks: [
                { type: 'p', text: 'ეს პოლიტიკა განმარტავს, რა პერსონალურ მონაცემებს ვაგროვებთ მომხმარებლებისა და მკერავების/ატელიეებისგან, საიდან ვიღებთ მათ, რატომ და როგორ ვამუშავებთ, ვის შეიძლება გადავცეთ, რამდენ ხანს ვინახავთ და რა უფლებები გაქვთ. პოლიტიკა ვრცელდება Kere-ს ვებსაიტზე, ანგარიშებზე, შეკვეთებზე, გადახდებზე, მიწოდებაზე, მხარდაჭერასა და სხვა კომუნიკაციებზე. მობილურ აპლიკაციაზე იგი გავრცელდება შესაბამისი განახლებისა და მომხმარებლის წინასწარი ინფორმირების შემდეგ.' },
            ],
        },
        {
            n: 3,
            title: 'რა მონაცემებს ვაგროვებთ',
            blocks: [
                {
                    type: 'table',
                    head: ['კატეგორია', 'მონაცემები'],
                    rows: [
                        ['ანგარიში და კონტაქტი', 'სახელი, ელფოსტა, ტელეფონის ნომერი, ანგარიშის მონაცემები და კომუნიკაციის ისტორია.'],
                        ['შეკვეთა და მიწოდება', 'მიწოდების მისამართი, არჩეული სამოსი, ზომა, ფერი, მასალა, ვადა, შეკვეთის სტატუსი და მითითებები.'],
                        ['ზომები და დიზაინის მასალა', 'სხეულის ზომები, ატვირთული ფოტოები, ესკიზები, დიზაინები, ფაილები, შენიშვნები და მორგების პრეფერენციები.'],
                        ['გადახდა და ტრანზაქცია', 'შეკვეთის ღირებულება, გადახდის სტატუსი, ტრანზაქციის იდენტიფიკატორი, დაბრუნებისა და ანაზღაურების ჩანაწერები. Kere არ ინახავს ბარათის სრულ ნომერს, PIN-ს ან CVV/CVC კოდს.'],
                        ['მკერავი/ატელიე', 'სახელი ან ბიზნესის დასახელება, ტელეფონი, ელფოსტა, საბანკო რეკვიზიტები, პორტფოლიო, მდებარეობა, გამოცდილება, ხელმისაწვდომობა, შეთავაზებები, შეფასებები და შეკვეთების ისტორია.'],
                        ['ტექნიკური მონაცემები', 'IP მისამართი, მოწყობილობისა და ბრაუზერის ტიპი, უსაფრთხოების ჟურნალები, შესვლის დრო და ვებსაიტთან ტექნიკური ინტერაქცია.'],
                        ['ანალიტიკა — მხოლოდ თანხმობით', 'მონახულებული გვერდები, სესიის ხანგრძლივობა, გამოყენების ზოგადი გზა, მოწყობილობის ტიპი და სავარაუდო მდებარეობა.'],
                    ],
                },
            ],
        },
        {
            n: 4,
            title: 'საიდან ვიღებთ მონაცემებს და რომელია სავალდებულო',
            blocks: [
                { type: 'p', text: 'მონაცემებს ვიღებთ უშუალოდ მომხმარებლისგან ან მკერავისგან/ატელიესგან; გადახდის მომსახურების მიმწოდებლისგან; მიწოდების პარტნიორისგან; მოწყობილობის, უსაფრთხოების ჟურნალებისა და ქუქი-ფაილების მეშვეობით; და, შესაბამის შემთხვევაში, საჯაროდ ხელმისაწვდომი პროფესიული ან ბიზნესწყაროებიდან. თუ მონაცემი უშუალოდ თქვენგან არ მიგვიღია, კანონით მოთხოვნილ შემთხვევაში შეგატყობინებთ მონაცემის კატეგორიას, წყაროსა და დამუშავების პირობებს.' },
                { type: 'p', text: 'ანგარიშის შექმნისა და შეკვეთის შესასრულებლად აუცილებელია შესაბამისი სარეგისტრაციო, საკონტაქტო, შეკვეთის, მიწოდებისა და გადახდის მონაცემების მიწოდება. მათი არმიწოდების შემთხვევაში Kere-მ შესაძლოა ვერ შექმნას ანგარიში, ვერ შეაფასოს ან ვერ შეასრულოს შეკვეთა, ვერ დაამუშაოს გადახდა ან ვერ უზრუნველყოს მიწოდება. კონკრეტული შეკვეთისთვის ზომის, ფოტოს ან დიზაინის მიწოდება სავალდებულოა მხოლოდ მაშინ, როდესაც მის გარეშე ინდივიდუალური სამოსის დამზადება შეუძლებელია.' },
                { type: 'p', text: 'მარკეტინგული შეტყობინებებისა და არასავალდებულო ანალიტიკური ტექნოლოგიების გამოყენება ნებაყოფლობითია. მათზე უარი ანგარიშის შექმნასა და შეკვეთის განთავსებას ხელს არ უშლის.' },
            ],
        },
        {
            n: 5,
            title: 'რატომ და რა სამართლებრივი საფუძვლით ვამუშავებთ მონაცემებს',
            blocks: [
                { type: 'p', text: 'ხელშეკრულების დასადებად მომხმარებლის მოთხოვნით გადადგმული ნაბიჯები და ხელშეკრულების შესრულება: ანგარიშის შექმნა, ფასის შეფასება, შეკვეთის განთავსება, მკერავის შერჩევა, წარმოება, გადახდა, მიწოდება, მხარდაჭერა, დავის განხილვა და თანხის დაბრუნება.' },
                { type: 'p', text: 'კანონით დაკისრებული ვალდებულება: ბუღალტრული, საგადასახადო, ტრანზაქციისა და სხვა სავალდებულო ჩანაწერების წარმოება და უფლებამოსილი ორგანოს კანონიერი მოთხოვნის შესრულება.' },
                { type: 'p', text: 'Kere-ს ან მესამე პირის მნიშვნელოვანი ლეგიტიმური ინტერესი: ანგარიშებისა და პლატფორმის უსაფრთხოება, თაღლითობის პრევენცია, მომსახურების ხარისხის კონტროლი და სამართლებრივი მოთხოვნების დაცვა, თუ მონაცემთა სუბიექტის უფლებებსა და ინტერესებს უპირატესი მნიშვნელობა არ აქვს.' },
                { type: 'p', text: 'თანხმობა: არასავალდებულო ანალიტიკა, მარკეტინგული ელფოსტა/SMS/შეტყობინებები და სხვა შემთხვევები, როდესაც თანხმობა საჭიროა. თანხმობის უკან გამოთხოვა შესაძლებელია უსასყიდლოდ და ისეთივე მარტივი გზით, როგორითაც იგი გაიცა; ეს არ მოქმედებს მანამდე კანონიერად განხორციელებულ დამუშავებაზე.' },
            ],
        },
        {
            n: 6,
            title: 'ზომები, ფოტოები და დიზაინები',
            blocks: [
                { type: 'p', text: 'Kere ზომებს, ფოტოებსა და დიზაინებს იყენებს მხოლოდ ფასის შეფასების, სამოსის დამზადების, მორგების, ხარისხის უზრუნველყოფისა და მომხმარებლის მიერ მოთხოვნილი მომსახურების გასაწევად. მომხმარებელმა უნდა ატვირთოს მხოლოდ ისეთი მასალა, რომლის გამოყენების უფლებაც აქვს, და არ უნდა ატვირთოს სხვა პირის ფოტო ან მონაცემები შესაბამისი ნებართვის გარეშე.' },
                { type: 'p', text: 'ზომები შეიძლება შეინახოს მომხმარებლის ანგარიშში მომავალი შეკვეთების გასამარტივებლად. მომხმარებელს შეუძლია მათი ნახვა, განახლება ან წაშლა; თუმცა აქტიური შეკვეთის შესრულებისთვის აუცილებელი მონაცემის წაშლა შეიძლება გადაიდოს შეკვეთის დასრულებამდე ან გამოიწვიოს შეკვეთის შესრულების შეუძლებლობა.' },
                { type: 'p', text: 'Kere არ იყენებს ზომებს ან ფოტოებს პირის უნიკალური იდენტიფიცირებისთვის, ჯანმრთელობის შესახებ დასკვნების გამოსატანად, გარეგნობის შეფასებისთვის ან დისკრიმინაციული პროფაილინგისთვის. ფოტოები და დიზაინები საჯაროდ არ ქვეყნდება მომხმარებლის ცალკე თანხმობის გარეშე.' },
                { type: 'p', text: 'თუ Kere მომავალში გამოიყენებს ფოტოს ავტომატური ანალიზის ან ზომების ავტომატურად განსაზღვრის ტექნოლოგიას, მის ჩართვამდე მომხმარებელს მიეწოდება ინფორმაცია გამოყენებული მეთოდის, მიმწოდებლის, მიზნის, შენახვის ვადისა და შესაძლო საერთაშორისო გადაცემის შესახებ და, საჭიროების შემთხვევაში, მიღებული იქნება ცალკე თანხმობა.' },
            ],
        },
        {
            n: 7,
            title: 'რა მონაცემებს ხედავს მკერავი',
            blocks: [
                { type: 'p', text: 'შერჩეულ მკერავს/ატელიეს გადაეცემა მხოლოდ სამოსის დასამზადებლად აუცილებელი ინფორმაცია: მომხმარებლის სახელი, საჭირო ზომები, შესაბამისი ფოტოები და დიზაინი, მასალისა და სტილის არჩევანი, ვადა და შეკვეთის ტექნიკური პირობები.' },
                { type: 'p', text: 'მკერავი Kere-სგან არ მიიღებს მომხმარებლის ტელეფონის ნომერს, ელფოსტას, გადახდის მონაცემებს ან მიწოდების მისამართს, თუ ეს კონკრეტული მომსახურებისთვის აუცილებელი არ არის. ასეთ შემთხვევაში მომხმარებელი წინასწარ სათანადოდ იქნება ინფორმირებული. მკერავს ეკრძალება მონაცემების საკუთარი მარკეტინგისთვის ან Kere-ს შეკვეთის ფარგლებს გარეთ გამოყენება და მას ეკისრება კონფიდენციალურობისა და უსაფრთხოების ვალდებულებები. თუ კონკრეტულ შემთხვევაში მკერავი მონაცემებს დამოუკიდებლად განსაზღვრული მიზნით დაამუშავებს, მომხმარებელი ამის შესახებ მონაცემთა გადაცემამდე მიიღებს ინფორმაციას.' },
            ],
        },
        {
            n: 8,
            title: 'გადახდები',
            blocks: [
                { type: 'p', text: 'გადახდები, მომხმარებლის მიერ checkout-ზე არჩეული მეთოდის შესაბამისად, მუშავდება Bank of Georgia-ს ან TBC Bank-ის უსაფრთხო გადახდის ინფრასტრუქტურის მეშვეობით. შესაბამისი ბანკი მონაცემებს საკუთარი კონფიდენციალურობისა და უსაფრთხოების წესების შესაბამისად ამუშავებს. Kere ჩვეულებრივ იღებს მხოლოდ ტრანზაქციის დასადასტურებლად, შეკვეთის მართვისა და აღრიცხვისთვის საჭირო ინფორმაციას და არ ინახავს ბარათის სრულ მონაცემებს. თუ გადახდის მომსახურების მიმწოდებელი შეიცვლება, მომხმარებელი გადახდამდე მიიღებს განახლებულ ინფორმაციას.' },
            ],
        },
        {
            n: 9,
            title: 'ქუქი-ფაილები და მსგავსი ტექნოლოგიები',
            blocks: [
                { type: 'p', text: 'აუცილებელი ქუქი-ფაილები გამოიყენება ანგარიშში შესვლის, კალათის, ენის არჩევის, უსაფრთხოებისა და ვებსაიტის ძირითადი ფუნქციებისთვის. მათი გამორთვის შემთხვევაში ვებსაიტის ნაწილი შეიძლება სწორად აღარ მუშაობდეს.' },
                { type: 'p', text: 'არასავალდებულო ანალიტიკური ტექნოლოგიები ჩაირთვება მხოლოდ მომხმარებლის თანხმობის შემდეგ. მომხმარებელს შეუძლია მათი უარყოფა ან არჩევანის შეცვლა „ქუქი-ფაილების პარამეტრებიდან“. არასავალდებულო ქუქი-ფაილის ჩართვამდე პარამეტრებში მიეთითება მისი დასახელება, მიმწოდებელი, მიზანი, კატეგორია და მოქმედების ვადა. თანხმობის არჩევანი აღირიცხება კანონთან შესაბამისობის დასადასტურებლად.' },
            ],
        },
        {
            n: 10,
            title: 'მარკეტინგული კომუნიკაცია',
            blocks: [
                { type: 'p', text: 'მარკეტინგულ ელფოსტას, SMS-ს ან სხვა სარეკლამო შეტყობინებებს Kere აგზავნის მხოლოდ შესაბამისი თანხმობის საფუძველზე. მარკეტინგზე თანხმობა არ არის ანგარიშის შექმნის ან შეკვეთის განთავსების პირობა.' },
                { type: 'p', text: 'თანხმობის გაუქმება შესაძლებელია შეტყობინებაში მოცემული ბმულით/ინსტრუქციით ან kereforyou@gmail.com-ზე წერილის გამოგზავნით. Kere შეწყვეტს პირდაპირი მარკეტინგის მიზნით მონაცემთა დამუშავებას გონივრულ ვადაში, მაგრამ არაუგვიანეს მოთხოვნის მიღებიდან 7 სამუშაო დღისა. თანხმობის მიცემისა და გაუქმების დრო და ფაქტი ინახება მარკეტინგის მიმდინარეობისას და მისი შეწყვეტიდან 1 წლის განმავლობაში.' },
            ],
        },
        {
            n: 11,
            title: 'ვის ვუზიარებთ მონაცემებს',
            blocks: [
                { type: 'p', text: 'მონაცემები შეიძლება, მხოლოდ აუცილებელი მოცულობით, გადაეცეს: შეკვეთის შემსრულებელ მკერავს/ატელიეს; მომხმარებლის მიერ არჩეულ Bank of Georgia-ს ან TBC Bank-ს; ჰოსტინგის, ღრუბლოვანი ინფრასტრუქტურის, ელფოსტის, უსაფრთხოების, ანალიტიკისა და ტექნიკური მხარდაჭერის მიმწოდებლებს; მიწოდების პარტნიორებს; პროფესიულ მრჩევლებს; და უფლებამოსილ საჯარო ორგანოებს, როდესაც ამას კანონი მოითხოვს.' },
                { type: 'p', text: 'Kere არ ყიდის პერსონალურ მონაცემებს. მომსახურების მიმწოდებლებს მონაცემები გადაეცემათ მხოლოდ შესაბამისი მიზნისთვის, წერილობითი ან სხვა სამართლებრივად სავალდებულო კონფიდენციალურობის, უსაფრთხოებისა და მონაცემთა დამუშავების პირობებით. კონკრეტული მოქმედი ანალიტიკური და ქუქი-ფაილების მიმწოდებლები მითითებული იქნება „ქუქი-ფაილების პარამეტრებში“ მათ ჩართვამდე.' },
            ],
        },
        {
            n: 12,
            title: 'საერთაშორისო გადაცემა და ჰოსტინგი',
            blocks: [
                { type: 'p', text: 'Kere-ს ზოგიერთი ტექნიკური მიმწოდებელი შესაძლოა მონაცემებს საქართველოს ფარგლებს გარეთ ამუშავებდეს. ასეთი გადაცემა განხორციელდება მხოლოდ საქართველოს კანონმდებლობით გათვალისწინებული საფუძვლისა და სათანადო გარანტიების არსებობისას — მაგალითად, მონაცემთა დაცვის სათანადო გარანტიების მქონე სახელმწიფოში გადაცემის, უფლებამოსილი ორგანოს ნებართვის, შესაბამისი სახელშეკრულებო გარანტიების ან სხვა კანონით დაშვებული საფუძვლის გამოყენებით.' },
                { type: 'p', text: 'მომხმარებელს შეუძლია kereforyou@gmail.com-ზე მოითხოვოს ინფორმაცია მოქმედი საერთაშორისო გადაცემის, მიმღები ქვეყნისა და გამოყენებული გარანტიების შესახებ. თუ კანონით შესაბამისი საფუძველი და გარანტიები ვერ იქნება უზრუნველყოფილი, მონაცემები საერთაშორისო დონეზე არ გადაიცემა.' },
            ],
        },
        {
            n: 13,
            title: 'რამდენ ხანს ვინახავთ მონაცემებს',
            blocks: [
                {
                    type: 'table',
                    head: ['მონაცემის კატეგორია', 'შენახვის პერიოდი ან კრიტერიუმი'],
                    rows: [
                        ['ანგარიში და პროფილი', 'ანგარიშის არსებობის პერიოდში და დახურვიდან არაუმეტეს 3 წლისა, თუ უფრო ხანგრძლივი შენახვა არ არის საჭირო კანონით ან სამართლებრივი მოთხოვნისთვის.'],
                        ['ზომები', 'მომხმარებლის წაშლამდე ან ანგარიშის დახურვამდე; აქტიური შეკვეთის არსებობისას — შეკვეთის დასრულებამდე. სარეზერვო ასლებიდან წაშლა ხდება არაუმეტეს 90 დღეში.'],
                        ['ფოტოები და დიზაინები', 'აქტიური შეკვეთის პერიოდში და მისი დასრულებიდან არაუმეტეს 90 დღისა, თუ მომხმარებელი ცალკე არ აირჩევს ანგარიშში მომავალი შეკვეთებისთვის შენახვას ან უფრო ხანგრძლივი შენახვა არ არის აუცილებელი დავისთვის.'],
                        ['შეკვეთა, გადახდა და ბუღალტერია', 'საქართველოს კანონმდებლობით მოთხოვნილი საგადასახადო და ბუღალტრული პერიოდის განმავლობაში.'],
                        ['მხარდაჭერა და დავა', 'საკითხის დასრულებიდან 3 წლის განმავლობაში; მიმდინარე დავის შემთხვევაში — მის საბოლოო დასრულებამდე და საჭირო კანონიერ პერიოდამდე.'],
                        ['ტექნიკური და უსაფრთხოების ჟურნალები', 'ჩვეულებრივ 12 თვემდე; უსაფრთხოების ინციდენტის ან სამართლებრივი მოთხოვნის შემთხვევაში — საჭირო დამატებითი პერიოდით.'],
                        ['მარკეტინგული თანხმობის ჩანაწერი', 'მარკეტინგის მიმდინარეობისას და მისი შეწყვეტიდან 1 წლის განმავლობაში.'],
                        ['ანალიტიკა და არასავალდებულო ქუქი-ფაილები', 'ქუქი-ფაილების პარამეტრებში მითითებული ვადით, ჩვეულებრივ არაუმეტეს 12 თვისა.'],
                    ],
                },
                { type: 'p', text: 'როდესაც მონაცემები აღარ არის საჭირო, იგი წაიშლება, განადგურდება ან გარდაიქმნება ისეთ ფორმად, რომ პირის იდენტიფიცირება აღარ იყოს შესაძლებელი. კონკრეტული ვადა შეიძლება გაგრძელდეს მხოლოდ კანონით დაკისრებული მოვალეობის, უსაფრთხოების ინციდენტის, დავის ან სამართლებრივი მოთხოვნის გამო.' },
            ],
        },
        {
            n: 14,
            title: 'მონაცემთა უსაფრთხოება',
            blocks: [
                { type: 'p', text: 'Kere იყენებს მონაცემთა ხასიათისა და რისკის შესაბამის ტექნიკურ და ორგანიზაციულ უსაფრთხოების ზომებს, მათ შორის, საჭიროებისამებრ, როლებზე დაფუძნებულ წვდომას, პაროლებისა და მონაცემთა გადაცემის დაცვას, უსაფრთხოების ჟურნალებს, სარეზერვო ასლებს, წვდომის პერიოდულ გადამოწმებას და თანამშრომლებისა და პარტნიორების კონფიდენციალურობის ვალდებულებებს. პოლიტიკაში აღწერილი ღონისძიებები გამოიყენება მხოლოდ იმ მოცულობით, რა მოცულობითაც ისინი რეალურად არის დანერგილი და მოწმდება.' },
                { type: 'p', text: 'ინტერნეტით მონაცემთა გადაცემის სრულად რისკისგან თავისუფალი მეთოდი არ არსებობს. უსაფრთხოების ინციდენტის შემთხვევაში Kere აღრიცხავს ინციდენტს და, კანონით დადგენილი პირობების არსებობისას, მისი აღმოჩენიდან არაუგვიანეს 72 საათისა აცნობებს საქართველოს სახელმწიფო აუდიტის სამსახურს, აგრეთვე საჭიროების შემთხვევაში — მონაცემთა სუბიექტებს.' },
            ],
        },
        {
            n: 15,
            title: 'ასაკობრივი შეზღუდვა',
            blocks: [
                { type: 'p', text: 'Kere განკუთვნილია 16 წლის ან უფროსი პირებისთვის. ანგარიშის შექმნით მომხმარებელი ადასტურებს, რომ მინიმუმ 16 წლისაა. თუ Kere გაიგებს, რომ 16 წლამდე პირის მონაცემები სათანადო სამართლებრივი საფუძვლის ან მშობლის/კანონიერი წარმომადგენლის საჭირო თანხმობის გარეშე დამუშავდა, მიიღებს შესაბამის ზომებს მონაცემების წასაშლელად ან დამუშავების შესაწყვეტად. 16–17 წლის მომხმარებლის მიერ ფასიანი შეკვეთის განთავსების პირობები დამატებით განისაზღვრება Kere-ს მომსახურების პირობებით და მოქმედი კანონმდებლობით.' },
            ],
        },
        {
            n: 16,
            title: 'ავტომატური ფასის შეფასება',
            blocks: [
                { type: 'p', text: 'Kere-მ შეიძლება სამოსის ტიპის, მასალის, დეტალების, ზომებისა და შეკვეთის სხვა პარამეტრების საფუძველზე ავტომატურად გამოთვალოს სავარაუდო ფასი. ეს არის წინასწარი შეფასება და არა მომხმარებლისთვის სამართლებრივი ან ფინანსური შედეგის მქონე საბოლოო, სრულად ავტომატიზებული გადაწყვეტილება. საბოლოო ფასი შეიძლება დაადასტუროს ან დასაბუთებულად შეცვალოს მკერავმა დიზაინის განხილვის შემდეგ, ხოლო მომხმარებელს საბოლოო გადახდამდე შეუძლია მიიღოს ინფორმაცია შეფასების ძირითად ფაქტორებზე, მოითხოვოს ადამიანის ჩარევა და არ მიიღოს შეცვლილი ფასი.' },
            ],
        },
        {
            n: 17,
            title: 'თქვენი უფლებები',
            blocks: [
                { type: 'p', text: 'კანონით გათვალისწინებულ ფარგლებში შეგიძლიათ მოითხოვოთ: ინფორმაცია თქვენი მონაცემების დამუშავების შესახებ; მონაცემებზე წვდომა და ასლი; არაზუსტი მონაცემების გასწორება, განახლება ან შევსება; დამუშავების შეწყვეტა, წაშლა ან განადგურება; მონაცემების დაბლოკვა; თანხმობის უკან გამოთხოვა; ტექნიკურად შესაძლებელ შემთხვევაში მონაცემთა გადატანა; და ავტომატურ გადაწყვეტილებასთან დაკავშირებით ადამიანის ჩარევა ან გასაჩივრება.' },
                { type: 'p', text: 'მოთხოვნისთვის მოგვწერეთ kereforyou@gmail.com. პირადობის დასაცავად შეიძლება დაგვჭირდეს თქვენი იდენტობის გონივრული დადასტურება. უფლებების განხორციელება, კანონით გათვალისწინებული გამონაკლისების გარდა, უფასოა. მოთხოვნებს ვუპასუხებთ შესაბამის კანონიერ ვადაში; უმეტეს შემთხვევაში — არაუგვიანეს 10 სამუშაო დღისა. განსაკუთრებულ და სათანადოდ დასაბუთებულ შემთხვევაში ვადა შეიძლება გაგრძელდეს არაუმეტეს დამატებითი 10 სამუშაო დღით, რის შესახებაც დაუყოვნებლივ შეგატყობინებთ.' },
            ],
        },
        {
            n: 18,
            title: 'გასაჩივრება',
            blocks: [
                { type: 'p', text: 'თუ მიიჩნევთ, რომ თქვენი უფლებები დაირღვა, შეგიძლიათ მიმართოთ საქართველოს სახელმწიფო აუდიტის სამსახურს (www.sao.ge) ან სასამართლოს. სახელმწიფო აუდიტის სამსახური 2026 წლის 2 მარტიდან ახორციელებს საქართველოში პერსონალური მონაცემების დამუშავების კანონიერების კონტროლს.' },
            ],
        },
        {
            n: 19,
            title: 'პოლიტიკის ცვლილებები',
            blocks: [
                { type: 'p', text: 'Kere-ს შეუძლია ეს პოლიტიკა განაახლოს მომსახურების, ტექნოლოგიის, პარტნიორების ან სამართლებრივი მოთხოვნების ცვლილებისას. არსებითი ცვლილების შემთხვევაში მომხმარებელს ეცნობება ვებსაიტზე, ანგარიშში ან შესაბამისი საკონტაქტო არხით ცვლილების ამოქმედებამდე, როდესაც ეს შესაძლებელია ან კანონით საჭიროა. პოლიტიკის დასაწყისში ყოველთვის მიეთითება მოქმედი ვერსია და ძალაში შესვლის თარიღი.' },
            ],
        },
        {
            n: 20,
            title: 'კონტაქტი',
            blocks: [
                { type: 'p', text: 'შპს „კერე შენთვის“' },
                { type: 'p', text: 'ინგლისური რეგისტრირებული დასახელება: KereForYou' },
                { type: 'p', text: 'საიდენტიფიკაციო ნომერი: 406562376' },
                { type: 'p', text: 'ელფოსტა: kereforyou@gmail.com' },
                { type: 'p', text: 'Kere-ს საფირმო სახელწოდება, სამართლებრივი ფორმა, მისამართი, საკონტაქტო ინფორმაცია და საიდენტიფიკაციო ნომერი მუდმივად და ადვილად ხელმისაწვდომია ვებგვერდის „იურიდიული ინფორმაციის“ გვერდზე ან მომსახურების პირობებში.' },
            ],
        },
    ],
};

const en: PolicyDoc = {
    title: 'Privacy Policy',
    version: 'Version 2.0  •  Effective: 22 July 2026',
    sections: [
        {
            n: 1,
            title: 'Who We Are',
            blocks: [
                { type: 'p', text: 'KereForYou LLC (Georgian registered name: შპს „კერე შენთვის“; identification number 406562376) operates the Kere website and, following an appropriate update, its mobile application, and is the controller responsible for processing personal data.' },
                { type: 'p', text: 'Privacy contact: kereforyou@gmail.com.' },
            ],
        },
        {
            n: 2,
            title: 'Scope',
            blocks: [
                { type: 'p', text: 'This Policy explains what personal data we collect from customers and tailors/ateliers, where it comes from, why and how we process it, who may receive it, how long it is retained, and the rights available to you. It applies to the Kere website, accounts, orders, payments, deliveries, support and other communications. It will apply to a mobile application only after an appropriate update and advance notice to users.' },
            ],
        },
        {
            n: 3,
            title: 'Information We Collect',
            blocks: [
                {
                    type: 'table',
                    head: ['Category', 'Information'],
                    rows: [
                        ['Account and contact', 'Name, email address, telephone number, account details and communication history.'],
                        ['Order and delivery', 'Delivery address, garment selection, size, colour, material, deadline, order status and instructions.'],
                        ['Measurements and design content', 'Body measurements, uploaded photographs, sketches, designs, files, notes and fitting preferences.'],
                        ['Payment and transaction', 'Order value, payment status, transaction identifier, refund and reimbursement records. Kere does not store full card numbers, PINs or CVV/CVC codes.'],
                        ['Tailor/atelier', 'Personal or business name, phone number, email, bank details, portfolio, location, experience, availability, offers, ratings and order history.'],
                        ['Technical', 'IP address, device and browser type, security logs, login times and technical interactions with the website.'],
                        ['Analytics — consent only', 'Pages visited, session duration, general navigation path, device type and approximate location.'],
                    ],
                },
            ],
        },
        {
            n: 4,
            title: 'Sources and Whether Information Is Required',
            blocks: [
                { type: 'p', text: 'We obtain information directly from customers or tailors/ateliers; from payment service providers; from delivery partners; through devices, security logs and cookies; and, where relevant, from publicly available professional or business sources. Where information is not obtained directly from you, Kere will, when required by law, inform you of the relevant category, source and processing conditions.' },
                { type: 'p', text: 'Registration, contact, order, delivery and payment information relevant to the requested service is required to create an account and fulfil an order. Without it, Kere may be unable to create an account, estimate or fulfil an order, process payment or arrange delivery. Measurements, photos or designs are required only where a specific custom order cannot be fulfilled without them.' },
                { type: 'p', text: 'Marketing communications and optional analytics technologies are voluntary. Refusing them does not prevent account creation or order placement.' },
            ],
        },
        {
            n: 5,
            title: 'Purposes and Legal Bases',
            blocks: [
                { type: 'p', text: 'Steps requested before a contract and performance of a contract: account creation, price estimates, order placement, tailor selection, production, payment, delivery, support, dispute handling and refunds.' },
                { type: 'p', text: 'Legal obligations: accounting, tax, transaction and other mandatory records, and compliance with lawful requests from authorised bodies.' },
                { type: 'p', text: 'Important legitimate interests of Kere or a third party: account and platform security, fraud prevention, service-quality controls and protection of legal claims, unless overridden by the rights and interests of the data subject.' },
                { type: 'p', text: 'Consent: optional analytics, marketing email/SMS/notifications and other processing where consent is required. Consent may be withdrawn free of charge and as easily as it was given, without affecting prior lawful processing.' },
            ],
        },
        {
            n: 6,
            title: 'Measurements, Photos and Designs',
            blocks: [
                { type: 'p', text: 'Kere uses measurements, photographs and designs only to estimate price, produce and fit garments, assure quality and provide the requested service. Users must upload only content they are entitled to use and must not upload another person’s image or information without appropriate authorisation.' },
                { type: 'p', text: 'Measurements may be stored in the user’s account to simplify future orders. Users may view, update or erase them; however, erasure of information required for an active order may be postponed until the order is completed or may make fulfilment impossible.' },
                { type: 'p', text: 'Kere does not use measurements or photos to uniquely identify a person, infer health conditions, judge appearance or conduct discriminatory profiling. Photos and designs are not published publicly without separate consent.' },
                { type: 'p', text: 'If Kere later introduces automated image analysis or automated measurement technology, users will be informed before activation about the method, provider, purpose, retention period and any international transfer, and separate consent will be obtained where required.' },
            ],
        },
        {
            n: 7,
            title: 'Information Available to Tailors',
            blocks: [
                { type: 'p', text: 'The selected tailor/atelier receives only information necessary to make the garment: the customer’s name, required measurements, relevant photos and design, material and style choices, deadline and technical order specifications.' },
                { type: 'p', text: 'Kere will not provide the customer’s phone number, email, payment information or delivery address unless necessary for the particular service. In that case, the customer will be appropriately informed in advance. Tailors are prohibited from using received information for their own marketing or outside the Kere order and are subject to confidentiality and security obligations. If a tailor processes information independently for a separately determined purpose, the customer will be informed before disclosure.' },
            ],
        },
        {
            n: 8,
            title: 'Payments',
            blocks: [
                { type: 'p', text: 'Depending on the payment method selected at checkout, payments are processed through the secure payment infrastructure of Bank of Georgia or TBC Bank. The relevant bank processes information under its own privacy and security terms. Kere generally receives only information necessary to confirm and manage a transaction and maintain required records, and does not store full card information. If the payment provider changes, users will receive updated information before payment.' },
            ],
        },
        {
            n: 9,
            title: 'Cookies and Similar Technologies',
            blocks: [
                { type: 'p', text: 'Necessary cookies support login, shopping-cart, language selection, security and core website functions. Parts of the website may not work correctly if they are disabled.' },
                { type: 'p', text: 'Optional analytics technologies activate only after consent. Users may reject them or change their choice later through “Cookie Settings”. Before an optional cookie is activated, the settings will identify its name, provider, purpose, category and duration. Consent choices are recorded to demonstrate compliance.' },
            ],
        },
        {
            n: 10,
            title: 'Marketing',
            blocks: [
                { type: 'p', text: 'Kere sends marketing email, SMS or other promotional notifications only with appropriate consent. Marketing consent is not required to create an account or place an order.' },
                { type: 'p', text: 'Consent may be withdrawn through the method stated in the message or by emailing kereforyou@gmail.com. Kere will stop processing for direct marketing within a reasonable period and no later than 7 working days after receiving the request. Records of consent and withdrawal are retained during marketing and for one year after it ends.' },
            ],
        },
        {
            n: 11,
            title: 'Recipients',
            blocks: [
                { type: 'p', text: 'Where necessary and only to the required extent, information may be shared with: the selected tailor/atelier; Bank of Georgia or TBC Bank selected by the user; hosting, cloud, email, security, analytics and technical-support providers; delivery partners; professional advisers; and authorised public bodies where legally required.' },
                { type: 'p', text: 'Kere does not sell personal data. Providers receive information only for the relevant purpose and under written or otherwise legally binding confidentiality, security and data-processing terms. Current analytics and cookie providers will be identified in “Cookie Settings” before activation.' },
            ],
        },
        {
            n: 12,
            title: 'International Transfers and Hosting',
            blocks: [
                { type: 'p', text: 'Some technical providers may process information outside Georgia. A transfer will take place only where a lawful transfer basis and appropriate safeguards exist, such as transfer to a country with adequate safeguards, authorisation by the competent authority, appropriate contractual safeguards, or another basis permitted by law.' },
                { type: 'p', text: 'Users may email kereforyou@gmail.com to request information about an active international transfer, the destination country and the safeguards used. If a lawful basis and appropriate safeguards cannot be ensured, the information will not be transferred internationally.' },
            ],
        },
        {
            n: 13,
            title: 'Retention',
            blocks: [
                {
                    type: 'table',
                    head: ['Information category', 'Retention period or criterion'],
                    rows: [
                        ['Account and profile', 'While the account exists and for no more than 3 years after closure, unless longer retention is required by law or for legal claims.'],
                        ['Measurements', 'Until the user erases them or closes the account; for an active order, until completion. Erasure from backups occurs within no more than 90 days.'],
                        ['Photos and designs', 'During an active order and for no more than 90 days after completion, unless the user separately chooses account storage for future orders or longer retention is necessary for a dispute.'],
                        ['Orders, payments and accounting', 'For the tax and accounting period required under Georgian law.'],
                        ['Support and disputes', 'For 3 years after resolution; for an ongoing dispute, until final resolution and any further lawful period.'],
                        ['Technical and security logs', 'Usually up to 12 months; longer where necessary for a security incident or legal claim.'],
                        ['Marketing consent records', 'During marketing and for one year after it ends.'],
                        ['Analytics and optional cookies', 'For the period stated in Cookie Settings, usually no more than 12 months.'],
                    ],
                },
                { type: 'p', text: 'When information is no longer necessary, it is erased, destroyed or anonymised. A specific period may be extended only because of a legal obligation, security incident, dispute or legal claim.' },
            ],
        },
        {
            n: 14,
            title: 'Security',
            blocks: [
                { type: 'p', text: 'Kere uses technical and organisational measures appropriate to the nature and risk of the information, including, where relevant, role-based access, password and transmission safeguards, security logging, backups, periodic access reviews and confidentiality obligations for personnel and partners. Measures described in this Policy are applied only to the extent actually implemented and reviewed.' },
                { type: 'p', text: 'No method of internet transmission is entirely risk-free. If a security incident occurs, Kere will record it and, where statutory conditions are met, notify the State Audit Office of Georgia no later than 72 hours after discovery and inform affected data subjects where required.' },
            ],
        },
        {
            n: 15,
            title: 'Age Restriction',
            blocks: [
                { type: 'p', text: 'Kere is intended for people aged 16 or older. By creating an account, a user confirms that they are at least 16. If Kere learns that information of a person under 16 has been processed without an appropriate legal basis or required consent from a parent/legal representative, it will take suitable steps to erase the information or stop processing. Conditions for paid orders by users aged 16–17 are further addressed in Kere’s Terms of Service and applicable law.' },
            ],
        },
        {
            n: 16,
            title: 'Automated Price Estimates',
            blocks: [
                { type: 'p', text: 'Kere may automatically estimate a price using garment type, materials, selected details, measurements and other order parameters. This is an initial estimate and not a final, solely automated decision producing legal or financial effects for the user. The tailor may confirm or reasonably adjust the price after reviewing the design. Before final payment, the user may obtain information about the principal pricing factors, request human intervention and reject an adjusted price.' },
            ],
        },
        {
            n: 17,
            title: 'Your Rights',
            blocks: [
                { type: 'p', text: 'Within applicable legal limits, you may request: information about processing; access and a copy; correction, updating or completion; termination, erasure or destruction; restriction/blocking; withdrawal of consent; technically feasible data portability; and human intervention or a challenge relating to automated decisions.' },
                { type: 'p', text: 'Email requests to kereforyou@gmail.com. Kere may reasonably verify your identity. Exercising rights is free of charge except where the law provides otherwise. Kere will respond within the applicable statutory period, usually no later than 10 working days. In exceptional and properly justified cases, this period may be extended by no more than a further 10 working days, and you will be informed without delay.' },
            ],
        },
        {
            n: 18,
            title: 'Complaints',
            blocks: [
                { type: 'p', text: 'If you believe your rights have been infringed, you may apply to the State Audit Office of Georgia (www.sao.ge) or a court. From 2 March 2026, the State Audit Office supervises the lawfulness of personal-data processing in Georgia.' },
            ],
        },
        {
            n: 19,
            title: 'Changes to This Policy',
            blocks: [
                { type: 'p', text: 'Kere may update this Policy when its services, technology, providers or legal requirements change. Where possible or legally required, material changes will be communicated through the website, account or an appropriate contact channel before taking effect. The current version and effective date will always appear at the beginning.' },
            ],
        },
        {
            n: 20,
            title: 'Contact',
            blocks: [
                { type: 'p', text: 'KereForYou LLC' },
                { type: 'p', text: 'Georgian registered name: შპს „კერე შენთვის“' },
                { type: 'p', text: 'Identification number: 406562376' },
                { type: 'p', text: 'Email: kereforyou@gmail.com' },
                { type: 'p', text: 'Kere’s company name, legal form, address, contact information and identification number are permanently and easily accessible on the website’s Legal Information page or in the Terms of Service.' },
            ],
        },
    ],
};

export const privacyPolicy: Record<'ka' | 'en', PolicyDoc> = { ka, en };
