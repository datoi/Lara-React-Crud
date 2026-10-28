@extends('emails.layout')

@section('title', 'საჭიროა თქვენი თანხმობა')

@section('content')
  <h1>გთხოვთ, დაადასტუროთ, რომ თანახმა ხართ, {{ $customer->first_name }} ისარგებლოს Kere-ით</h1>

  <p>{{ $customer->getFullName() }} დარეგისტრირდა Kere-ზე, სადაც სამოსი ინდივიდუალური შეკვეთით იკერება. მან თქვენი მონაცემები მიუთითა, როგორც მშობლის ან კანონიერი წარმომადგენლის.</p>

  <div class="detail">
    <strong>ვინ დარეგისტრირდა:</strong> {{ $customer->getFullName() }}<br>
    @if ($customer->email)
      <strong>მისი ელფოსტა:</strong> {{ $customer->email }}<br>
    @endif
    <strong>მითითებულია როგორც:</strong> {{ $customer->guardian_relationship === 'legal_guardian' ? 'კანონიერი მეურვე' : 'მშობელი' }}
  </div>

  <p>თქვენს დადასტურებამდე ამ ანგარიშით შეკვეთის განთავსება შეუძლებელია.</p>

  <a class="cta" href="{{ $consentUrl }}">თანხმობის დადასტურება</a>

  <p class="muted">თუ ამ წერილს არ ელოდით, არაფრის გაკეთება არ გჭირდებათ — თქვენი დადასტურების გარეშე ანგარიში შეზღუდული რჩება და ბმული უბრალოდ გამოუყენებელი დარჩება.</p>
@endsection

@section('footer')
  ეს ბმული მხოლოდ თქვენ გამოგეგზავნათ და მხოლოდ ერთხელ მუშაობს. გთხოვთ, არავის გაუგზავნოთ.<br>
  შპს „კერე შენთვის“ · თბილისი, საქართველო · <a href="{{ config('app.url') }}">kereforyou.com</a>
@endsection
