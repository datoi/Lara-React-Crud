@extends('emails.layout')

@section('title', 'თქვენი ანგარიში დადასტურდა')

@section('content')
  <h1>{{ $tailor->first_name }}, თქვენი ანგარიში დადასტურდა!</h1>
  <p>Kere-ზე თქვენი მკერავის ანგარიში განვიხილეთ და დავადასტურეთ. ახლა შეგიძლიათ შეხვიდეთ პანელზე, დაამატოთ ნამუშევრები და მიიღოთ შეკვეთები მთელი საქართველოდან.</p>

  <a href="{{ config('app.url') }}/login/tailor" class="cta">პანელზე გადასვლა</a>

  <div class="steps">
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-text"><strong>შეავსეთ პროფილი</strong> — დაამატეთ მოკლე ბიოგრაფია, სპეციალიზაცია და ფოტო, რომ მომხმარებლებმა გიპოვონ.</div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-text"><strong>დაამატეთ პირველი ნამუშევრები</strong> — მარკეტპლეისზე გამოსაჩენად დაამატეთ მინიმუმ 3 სამოსი.</div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-text"><strong>მზად ხართ</strong> — პროფილის მოწყობის შემდეგ მომხმარებლები დაგინახავენ და შეკვეთებს გამოგიგზავნიან.</div>
    </div>
  </div>
@endsection
