@extends('emails.layout')

@section('title', 'თქვენი განაცხადის შესახებ')

@section('content')
  <h1>თქვენი განაცხადის შესახებ</h1>
  <p>გამარჯობა, {{ $tailor->first_name }}! გმადლობთ, რომ Kere-ზე მკერავად შემოერთება გსურდათ.</p>
  <p>განაცხადის განხილვის შემდეგ, სამწუხაროდ, ამ ეტაპზე თქვენს ანგარიშს ვერ დავადასტურებთ.</p>

  @if(filled($reason))
  <div class="note-box"><strong>მიზეზი:</strong> {{ $reason }}</div>
  @endif

  <p>თუ ფიქრობთ, რომ შეცდომაა, ან გსურთ დამატებითი ინფორმაციის მოწოდება, მოგვწერეთ <a href="mailto:kereforyou@gmail.com">kereforyou@gmail.com</a>-ზე და თქვენს განაცხადს ხელახლა განვიხილავთ.</p>
  <p class="muted">აღნიშნული საკითხების მოგვარების შემდეგ შეგიძლიათ ხელახლა მოგვმართოთ.</p>
@endsection
