pragma circom 2.0.0;

/*  Age ≥ 18  + commitment
    public[0] = isAdult   (0/1)
    public[1] = commitment
*/
template AgeVerification() {
    /* ── PRIVATE IN ─────────────────────────── */
    signal input birthDay;        // 1-31
    signal input birthMonth;      // 1-12
    signal input birthYear;       // 1900-2010
    signal input salt;

    /* ── PUBLIC IN ──────────────────────────── */
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;

    /* ── OUTPUTS ────────────────────────────── */
    signal output isAdult;
    signal output commitment;

    /* ── Umur sederhana ─────────────────────── */
    signal yearDiff      <== currentYear - birthYear;

    component monthGE = GreaterEqThan(4);
    monthGE.in[0] <== currentMonth;
    monthGE.in[1] <== birthMonth;

    component dayGE = GreaterEqThan(6);
    dayGE.in[0] <== currentDay;
    dayGE.in[1] <== birthDay;

    component monthEQ = IsEqual();
    monthEQ.in[0] <== currentMonth;
    monthEQ.in[1] <== birthMonth;

    // pecah perkalian utk hindari non-quadratic
    signal temp1;        // monthEQ && dayGE
    temp1 <== monthEQ.out * dayGE.out;

    signal temp2;        // monthEQ && monthGE
    temp2 <== monthEQ.out * monthGE.out;

    signal birthdayPassed;
    birthdayPassed <== monthGE.out + temp1 - temp2;

    signal actualAge <== yearDiff - 1 + birthdayPassed;

    component ageGE = GreaterEqThan(7);   // umur <128
    ageGE.in[0] <== actualAge;
    ageGE.in[1] <== 18;
    isAdult      <== ageGE.out;

    /* ── Komitmen demo ──────────────────────── */
    commitment <== birthDay
                 + birthMonth * 100
                 + birthYear * 10000
                 + salt;

    /* ── RANGE CONSTRAINTS ──────────────────── */
    // birthDay 1–31
    component dMin = GreaterEqThan(6);
    dMin.in[0] <== birthDay;
    dMin.in[1] <== 1;
    dMin.out === 1;

    component dMax = LessThan(6);
    dMax.in[0] <== birthDay;
    dMax.in[1] <== 32;
    dMax.out === 1;

    // birthMonth 1–12
    component mMin = GreaterEqThan(4);
    mMin.in[0] <== birthMonth;
    mMin.in[1] <== 1;
    mMin.out === 1;

    component mMax = LessThan(4);
    mMax.in[0] <== birthMonth;
    mMax.in[1] <== 13;
    mMax.out === 1;

    // birthYear 1900–2010
    component yMin = GreaterEqThan(11);
    yMin.in[0] <== birthYear;
    yMin.in[1] <== 1900;
    yMin.out === 1;

    component yMax = LessThan(11);
    yMax.in[0] <== birthYear;
    yMax.in[1] <== 2011;
    yMax.out === 1;
}

/* ── UTILITIES ─────────────────────────────── */
template GreaterEqThan(n){
    assert(n<=252);
    signal input in[2];
    signal output out;
    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1];
    out      <== 1 - lt.out;
}

template LessThan(n){
    assert(n<=252);
    signal input in[2];
    signal output out;
    component n2b = Num2Bits(n+1);
    n2b.in <== in[0] + (1<<n) - in[1];
    out    <== 1 - n2b.out[n];
}

template Num2Bits(n){
    signal input in;
    signal output out[n];
    var acc=0; var pow=1;
    for (var i=0;i<n;i++){
        out[i] <-- (in>>i)&1;
        out[i]*(out[i]-1)===0;
        acc += out[i]*pow;
        pow += pow;
    }
    acc === in;
}

template IsZero(){
    signal input in;
    signal output out;
    signal inv;
    inv <-- in!=0 ? 1/in : 0;
    out <== -in*inv + 1;
    in*out === 0;
}

template IsEqual(){
    signal input in[2];
    signal output out;
    component iz = IsZero();
    iz.in <== in[0]-in[1];
    out <== iz.out;
}

component main = AgeVerification();