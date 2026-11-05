@extends('emails.layout')

@section('title', 'Kere — პაროლის აღდგენა')

@section('content')
  <h1>გამარჯობა, {{ $firstName }}!</h1>
  <p>ახალი პაროლის დასაყენებლად გამოიყენეთ ქვემოთ მოცემული კოდი. კოდი მოქმედებს {{ $minutes }} წუთის განმავლობაში.</p>

  <div class="code-box">{{ $code }}</div>

  <p class="muted">თუ პაროლის აღდგენა თქვენ არ მოგითხოვიათ, უგულებელყავით ეს წერილი — თქვენი პაროლი არ შეიცვლება.</p>
@endsection
